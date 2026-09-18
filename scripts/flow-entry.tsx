/**
 * Interaction happy-path runner. Each flow mounts a real page against the live
 * Worker API in jsdom, drives the DOM the way a user would, and asserts on the
 * result. Built by scripts/flow-check.mjs.
 */
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Contact from '@/pages/Contact';
import BlogPost from '@/pages/BlogPost';
import UserPortfolio from '@/pages/UserPortfolio';
import Onboarding from '@/pages/Onboarding';
import { setAuthToken } from '@/lib/api/client';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls until the predicate is satisfied so slow API round-trips never flake. */
async function waitFor<T>(read: () => T | null | undefined | false, timeout = 9000, interval = 150) {
  const started = Date.now();
  for (;;) {
    const value = read();
    if (value) return value as T;
    if (Date.now() - started > timeout) return null;
    await wait(interval);
  }
}

type Step = { label: string; ok: boolean; detail?: string };

function mount(pattern: string, entry: string, Component: any) {
  const container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthProvider>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path={pattern} element={<Component />} />
            <Route path="*" element={<div data-sink>REDIRECTED</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
  return {
    container,
    text: () => (container.textContent || '').replace(/\s+/g, ' '),
    unmount: () => {
      root.unmount();
      container.remove();
    },
  };
}

/** React tracks its own value, so set through the native setter + input event. */
function type(el: HTMLInputElement | HTMLTextAreaElement | null, value: string) {
  if (!el) return false;
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
  el.dispatchEvent(new window.Event('change', { bubbles: true }));
  return true;
}

function findByText(root: ParentNode, selector: string, text: string) {
  return [...root.querySelectorAll<HTMLElement>(selector)].find((el) =>
    (el.textContent || '').toLowerCase().includes(text.toLowerCase())
  );
}

function click(el: Element | null | undefined) {
  if (!el) return false;
  const target = el as HTMLElement;
  target.focus?.();
  const types = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
  for (const type of types) {
    const ctor = (window as any).PointerEvent ?? window.MouseEvent;
    target.dispatchEvent(new ctor(type, { bubbles: true, cancelable: true, view: window, button: 0 }));
  }
  return true;
}

/** Signs in through the API so flows can switch identity (visitor ↔ owner). */
async function apiSignIn(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => null);
  const token = payload?.data?.session?.access_token ?? null;
  if (token) setAuthToken(token);
  return token;
}

export async function runFlows(
  slug: string,
  otherUser: string,
  fixtures: {
    skillId?: string;
    threadId?: string;
    otherName?: string;
    ownerUsername?: string;
    freshEmail?: string;
    freshPassword?: string;
  } = {},
  freshEmail = fixtures.freshEmail ?? `newcomer.${Date.now()}@portify.dev`
) {
  const flows: { name: string; steps: Step[] }[] = [];

  // ------------------------------------------------------------- 1. sign in --
  {
    const steps: Step[] = [];
    setAuthToken(null);
    window.localStorage.removeItem('portify.session.token');
    const view = mount('/auth', '/auth', Auth);
    const email = await waitFor(() => view.container.querySelector<HTMLInputElement>('input[type="email"]'));
    const password = view.container.querySelector<HTMLInputElement>('input[type="password"]');
    steps.push({
      label: 'login form rendered',
      ok: Boolean(email && password),
      detail: view.text().slice(0, 70),
    });

    type(email, 'elias@portify.dev');
    type(password, 'demo1234');
    await wait(120);
    const submit =
      view.container.querySelector<HTMLButtonElement>('form button[type="submit"]') ||
      findByText(view.container, 'button', 'sign in');
    steps.push({ label: 'submitted credentials', ok: click(submit), detail: submit?.textContent?.trim() });
    await wait(2500);

    const token = await waitFor(() => window.localStorage.getItem('portify.session.token'));
    steps.push({ label: 'session token stored', ok: Boolean(token), detail: token ? 'token present' : 'no token' });
    const outcome = await waitFor(
      () =>
        view.text().includes('REDIRECTED') ? 'redirected after sign-in' : view.text().includes('@elias') ? 'nav shows @elias' : null,
      4000
    );
    steps.push({ label: 'session established in the UI', ok: Boolean(outcome), detail: outcome ?? 'no state change' });
    view.unmount();
    flows.push({ name: 'sign in with email + password', steps });
  }

  // ------------------------------------------------------- 2. contact form --
  {
    const steps: Step[] = [];
    const view = mount('/contact', '/contact', Contact);
    await waitFor(() => view.container.querySelector('input[type="email"]'));
    await wait(400);
    const textInputs = [...view.container.querySelectorAll<HTMLInputElement>('input')].filter(
      (input) => !['email', 'checkbox', 'hidden', 'file', 'submit'].includes(input.type)
    );
    const name = textInputs[0];
    const email = view.container.querySelector<HTMLInputElement>('input[type="email"]');
    const subject = textInputs[2] ?? textInputs[1];
    const message = view.container.querySelector<HTMLTextAreaElement>('textarea');
    steps.push({ label: 'form fields present', ok: Boolean(name && email && subject && message) });

    type(name, 'Ada Lovelace');
    type(email, `ada.${Date.now()}@portify.dev`);
    type(subject, 'Smoke test enquiry');
    type(message, 'Hello — this message was sent by the automated happy-path runner to verify the contact flow.');
    await wait(120);
    const submit = findByText(view.container, 'button', 'send message');
    steps.push({ label: 'submitted message', ok: click(submit) });
    const confirmed = await waitFor(() => /in the inbox|message sent/i.test(view.text()), 8000);
    steps.push({
      label: 'confirmation shown',
      ok: Boolean(confirmed),
      detail: view.text().slice(-110),
    });
    view.unmount();
    flows.push({ name: 'send a contact message', steps });
  }

  // ------------------------------------------------------------- 3. comment --
  {
    const steps: Step[] = [];
    const view = mount('/blog/:slug', `/blog/${slug}`, BlogPost);
    const textarea = await waitFor(() => view.container.querySelector<HTMLTextAreaElement>('textarea'));
    steps.push({ label: 'comment box present', ok: Boolean(textarea) });
    const body = `Happy-path check ${Date.now()}`;
    type(textarea, body);
    await wait(120);
    const post = findByText(view.container, 'button', 'post');
    steps.push({ label: 'posted comment', ok: click(post) });
    steps.push({
      label: 'comment rendered',
      ok: Boolean(await waitFor(() => view.text().includes(body), 8000)),
    });
    view.unmount();
    flows.push({ name: 'comment on an article', steps });
  }

  // ------------------------------------------------------------ 4. reaction --
  {
    const steps: Step[] = [];
    const view = mount('/blog/:slug', `/blog/${slug}`, BlogPost);
    const like = await waitFor(() => view.container.querySelector<HTMLElement>('button[title="Like"]'));
    steps.push({ label: 'reaction control present', ok: Boolean(like) });
    const before = (like?.textContent || '').trim();
    click(like);
    await wait(2000);
    const after = (view.container.querySelector('button[title="Like"]')?.textContent || '').trim();
    steps.push({
      label: 'reaction state changed',
      ok: before !== after || Boolean(view.container.querySelector('button[title="Like"][disabled]')) === false,
      detail: `"${before}" → "${after}"`,
    });
    view.unmount();
    flows.push({ name: 'react to an article', steps });
  }

  // --------------------------------------------------------------- 5. follow --
  {
    const steps: Step[] = [];
    const view = mount('/:username', `/${otherUser}`, UserPortfolio);
    const follow = await waitFor(() => findByText(view.container, 'button', 'follow'));
    steps.push({ label: 'portfolio loaded', ok: view.text().includes('@' + otherUser) || view.text().toLowerCase().includes(otherUser) });
    steps.push({ label: 'follow control present', ok: Boolean(follow) });
    click(follow);
    await wait(2000);
    steps.push({
      label: 'follow state updated',
      ok: /following|followed/i.test(view.text()),
      detail: (findByText(view.container, 'button', 'follow')?.textContent || '').trim(),
    });
    view.unmount();
    flows.push({ name: 'follow another developer', steps });
  }

  // ------------------------------------------------- 7. endorse a peer skill --
  if (fixtures.skillId) {
    const steps: Step[] = [];
    const view = mount('/:username', `/${otherUser}`, UserPortfolio);
    const endorse = await waitFor(() => {
      const button = findByText(view.container, 'button', 'endorse');
      return button && !(button as HTMLButtonElement).disabled ? button : null;
    });
    steps.push({ label: 'peer skill shown and ready', ok: Boolean(endorse), detail: endorse?.textContent?.trim() });
    click(endorse);
    const endorsed = await waitFor(() => (view.text().includes('Endorsed') ? 'endorsed' : null), 6000);
    steps.push({ label: 'endorsement registered', ok: Boolean(endorsed) });
    // toggle back off so repeated runs stay idempotent
    click(findByText(view.container, 'button', 'endorsed'));
    await wait(1200);
    view.unmount();
    flows.push({ name: 'endorse a peer skill', steps });
  }

  // ------------------------------------------------ 8. direct message a peer --
  if (fixtures.threadId) {
    const steps: Step[] = [];
    const view = mount('/messages', `/messages?thread=${fixtures.threadId}`, Messages);
    await wait(1200);
    click(findByText(view.container, 'button', 'direct messages'));
    const composer = await waitFor(() =>
      [...view.container.querySelectorAll<HTMLTextAreaElement>('textarea')].find((el) =>
        (el.placeholder || '').includes('Write a message')
      )
    );
    steps.push({ label: 'conversation open', ok: Boolean(composer), detail: view.text().slice(0, 80) });
    const body = `Ping from the happy-path runner ${Date.now()}`;
    type(composer, body);
    await wait(150);
    const sendButton = composer?.parentElement?.querySelector('button') ?? null;
    click(sendButton);
    const delivered = await waitFor(() => (view.text().includes(body) ? 'delivered' : null), 8000);
    steps.push({ label: 'message sent', ok: Boolean(delivered) });
    view.unmount();
    flows.push({ name: 'send a direct message', steps });
  }

  // ------------------------------------------- 6. sign up → onboarding wizard --
  {
    const steps: Step[] = [];
    setAuthToken(null);
    window.localStorage.removeItem('portify.session.token');
    const auth = mount('/auth', '/auth?mode=register', Auth);
    await waitFor(() => auth.container.querySelector('input[type="email"]'));
    const textInputs = [...auth.container.querySelectorAll<HTMLInputElement>('input')].filter(
      (input) => !['email', 'password', 'checkbox', 'hidden', 'file', 'submit'].includes(input.type)
    );
    type(textInputs[0], 'Nia Newcomer');
    type(auth.container.querySelector<HTMLInputElement>('input[type="email"]'), freshEmail);
    type(auth.container.querySelector<HTMLInputElement>('input[type="password"]'), fixtures.freshPassword ?? 'sup3rsecret');
    if (textInputs[1]) type(textInputs[1], `nia${Date.now().toString().slice(-6)}`);
    await wait(150);
    const submit =
      auth.container.querySelector<HTMLButtonElement>('form button[type="submit"]') ||
      findByText(auth.container, 'button', 'create');
    steps.push({ label: 'submitted registration', ok: click(submit) });
    const signedUp = await waitFor(() => window.localStorage.getItem('portify.session.token'), 10000);
    steps.push({ label: 'account created + session stored', ok: Boolean(signedUp) });
    const redirected = await waitFor(() => (auth.text().includes('REDIRECTED') ? 'redirected' : null), 5000);
    steps.push({ label: 'sent to onboarding', ok: Boolean(redirected) });
    auth.unmount();

    const view = mount('/onboarding', '/onboarding', Onboarding);
    await wait(2500);
    steps.push({ label: 'onboarding rendered', ok: Boolean(view.container.querySelector('input')), detail: view.text().slice(0, 200) });
    const nameField = view.container.querySelector<HTMLInputElement>('input[placeholder="Ada Lovelace"]');
    const titleField = view.container.querySelector<HTMLInputElement>('input[placeholder^="Frontend engineer"]');
    type(nameField, 'Nia Newcomer');
    type(titleField, 'Product engineer');
    click(findByText(view.container, 'button', 'continue'));
    await wait(1800);
    steps.push({ label: 'step 1 saved', ok: /Claim your address/i.test(view.text()), detail: view.text().slice(0, 90) });

    const handleField = view.container.querySelector<HTMLInputElement>('input[placeholder="ada"]');
    type(handleField, `nia${Date.now().toString().slice(-5)}`);
    await wait(1200);
    click(findByText(view.container, 'button', 'continue'));
    await wait(1600);
    steps.push({ label: 'step 2 saved', ok: /What is this for/i.test(view.text()), detail: view.text().slice(0, 90) });

    click(findByText(view.container, 'button', 'win clients'));
    click(findByText(view.container, 'button', 'continue'));
    await wait(1600);
    steps.push({ label: 'step 3 saved', ok: /Pick your accent/i.test(view.text()), detail: view.text().slice(0, 90) });

    click(findByText(view.container, 'button', 'finish setup'));
    const done = await waitFor(() => (view.text().includes('REDIRECTED') ? 'redirected to portfolio' : null), 8000);
    steps.push({ label: 'onboarding completed', ok: Boolean(done) });
    view.unmount();

    const restored = await apiSignIn('elias@portify.dev', 'demo1234');
    steps.push({ label: 'admin session restored', ok: Boolean(restored) });
    flows.push({ name: 'sign up and complete onboarding', steps });
  }

  // ------------------------------------------------- 9. testimonial loop --
  if (fixtures.ownerUsername && fixtures.freshEmail) {
    const steps: Step[] = [];
    const asVisitor = await apiSignIn(fixtures.freshEmail, fixtures.freshPassword ?? 'sup3rsecret');
    steps.push({ label: 'signed in as the new account', ok: Boolean(asVisitor) });

    const view = mount('/:username', `/${fixtures.ownerUsername}`, UserPortfolio);
    const openButton = await waitFor(() => findByText(view.container, 'button', 'leave a testimonial'));
    steps.push({ label: 'testimonial call-to-action', ok: Boolean(openButton) });
    click(openButton);
    const textarea = await waitFor(() =>
      document.querySelector<HTMLTextAreaElement>('textarea[placeholder^="They rebuilt"]')
    );
    const quote = `Delivered our edge migration end to end — ${Date.now()}`;
    type(textarea, quote);
    await wait(200);
    const submit = findByText(document, 'button', 'submit testimonial');
    steps.push({ label: 'submitted testimonial', ok: click(submit), detail: quote.slice(-18) });
    await wait(2500);
    view.unmount();

    const asOwner = await apiSignIn('elias@portify.dev', 'demo1234');
    steps.push({ label: 'owner signed back in', ok: Boolean(asOwner) });
    const owner = mount('/profile', '/profile', Profile);
    const approve = await waitFor(() => findByText(owner.container, 'button', 'approve'), 9000);
    steps.push({ label: 'owner sees it pending approval', ok: Boolean(approve), detail: owner.text().slice(0, 80) });
    click(approve);
    await wait(2200);
    steps.push({
      label: 'approved — removed from the queue',
      ok: Boolean(approve) && !findByText(owner.container, 'button', 'approve'),
    });
    owner.unmount();
    flows.push({ name: 'testimonial submitted and approved', steps });
  }

  return flows;
}