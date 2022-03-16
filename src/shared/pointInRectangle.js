/**
  * Check if there is a point inside the rectangle.
  */
export default (point, rect) => {
  return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
}