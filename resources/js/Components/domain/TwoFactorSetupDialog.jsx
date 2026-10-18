import Modal from '../ui/Modal';
import TwoFactorSetupFlow from './TwoFactorSetupFlow';
import useConfirmPassword from '../../Hooks/useConfirmPassword';

// Turn on two-factor from inside the app (the Security panel and the owner prompt).
export default function TwoFactorSetupDialog({ open, onClose, endpoints }) {
    const { confirm, dialog } = useConfirmPassword(endpoints.confirmPassword);

    return (
        <>
            <Modal open={open} onClose={onClose} title="Turn on two-factor sign in" size="lg" dismissOnBackdrop={false}>
                <TwoFactorSetupFlow endpoints={endpoints} ensureConfirmed={confirm} onDone={onClose} />
            </Modal>
            {dialog}
        </>
    );
}
