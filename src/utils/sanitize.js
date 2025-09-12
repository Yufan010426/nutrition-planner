import DOMPurify from 'dompurify';

export function sanitizeText(input) {
  const str = String(input ?? '');
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

export function sanitizeHtml(input) {
  return DOMPurify.sanitize(String(input ?? ''));
}
