import React, { useEffect } from 'react';
import { createJSAPIPanel, showSecurityGatewayConfirmModal } from '@wecom/jssdk';

interface QuickLoginComponentProps {
  confirmId: string;
}

const QuickLoginComponent: React.FC<QuickLoginComponentProps> = ({ confirmId }) => {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const modal = showSecurityGatewayConfirmModal({
        confirmId,
        onClose: () => {
          console.log('Modal closed');
        },
      });

      return () => {
        if (modal) {
          modal.unmount();
        }
      };
    }
  }, [confirmId]);

  return <div id="quick_login"></div>;
};

export default QuickLoginComponent;