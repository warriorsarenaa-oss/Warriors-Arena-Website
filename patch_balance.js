const fs = require('fs');
const file = 'src/app/admin/(dashboard)/reservations/view-booking-modal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<span className="text-wa-green text-lg font-bold">\{Number\(localBooking\.total_price_at_booking \|\| localBooking\.total_amount\) \- Number\(localBooking\.discount_amount \|\| 0\) \+ Number\(localBooking\.total_refill_cost \|\| 0\) \- Number\(localBooking\.deposit_amount \|\| 0\)\} EGP<\/span>/;

content = content.replace(regex, `<span className="text-wa-green text-lg font-bold">{Number(localBooking.total_price_at_booking || localBooking.total_amount) - (discountValue > 0 ? (discountType === 'percentage' ? ((Number(localBooking.total_price_at_booking || localBooking.total_amount) * discountValue) / 100) : discountValue) : Number(localBooking.discount_amount || 0)) + Number(localBooking.total_refill_cost || 0) - Number(localBooking.deposit_amount || 0)} EGP</span>`);

fs.writeFileSync(file, content);
console.log('balance patched');
