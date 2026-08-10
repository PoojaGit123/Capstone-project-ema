/**
 * Adventure Details block.
 * Renders a list of key/value pairs (Activity, Adventure Type, Trip Length,
 * Group Size, Difficulty, Price) as labeled rows.
 *
 * Expected content structure (one row per detail):
 *   | adventure-details |               |
 *   | Activity          | Surfing       |
 *   | Adventure Type    | Overnight Trip|
 *   | ...               | ...           |
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('adventure-details-item');
    const cells = [...row.children];
    if (cells[0]) cells[0].classList.add('adventure-details-label');
    if (cells[1]) cells[1].classList.add('adventure-details-value');
  });
}
