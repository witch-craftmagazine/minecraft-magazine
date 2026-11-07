import './styles.css';
import { BookViewer } from './ui/BookViewer';

window.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    const viewer = new BookViewer(appContainer);
    await viewer.init();
  }
});
