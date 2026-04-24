import { useEffect, useState } from "react";
import "../css/NotificationPopup.css";

type NotificationPopupProps = {
  message: string;
  duration?: number;
  onClose: () => void;
};

function NotificationPopup({ message, duration = 5, onClose }: NotificationPopupProps) {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (count <= 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onClose]);

  return (
    <div className="notification-popup">
      <h3>Notification</h3>
      <p>{message}</p>
      <p className="notification-counter">Closing in {count}s</p>
    </div>
  );
}

export default NotificationPopup;