import { Preview, isPreviewName } from './preview/Preview';

export function App() {
  const preview = new URLSearchParams(window.location.search).get('preview') ?? 'empty';
  return <Preview name={isPreviewName(preview) ? preview : 'empty'} />;
}
