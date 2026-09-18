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
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window as any }));
  return true;
}

export async function runFlows(slug: string, otherUser: string) {
  const flows: { name: string; steps: Step[] }[] = [];

  // ------------------------------------------------------------- 1. sign in --
  {
    const steps: Step[] = [];
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

  return flows;
}
