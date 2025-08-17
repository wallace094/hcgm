import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface DeleteModalProps {
  handleDelete: () => void;
  closeModal: (isRefetch?: boolean) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  handleDelete,
  closeModal,
}) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>This action cannot be undone.</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="ghost" onClick={() => closeModal()}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteModal;
