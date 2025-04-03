
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactConfirmationDialog({
  open,
  onClose,
}: ContactConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Message Sent Successfully!</AlertDialogTitle>
          <AlertDialogDescription>
            Thank you for reaching out. I'll get back to you as soon as possible.
            In the meantime, feel free to check out my projects or blog posts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
