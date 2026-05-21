const fs = require('fs');
const file = 'src/app/admin/(dashboard)/reservations/view-booking-modal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for discount
content = content.replace(
  /const \[leadStaffId, setLeadStaffId\] = useState<string>\(''\);/,
  `const [leadStaffId, setLeadStaffId] = useState<string>('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);`
);

// 2. Add effect to initialize discount
content = content.replace(
  /useEffect\(\(\) => \{\n\s+setLocalBooking\(booking\);\n\s+\}, \[booking\]\);/,
  `useEffect(() => {
    setLocalBooking(booking);
    if (booking) {
      setDiscountType(booking.discount_type || 'flat');
      setDiscountValue(booking.discount_value || 0);
    }
  }, [booking]);`
);

// 3. Update handleComplete to use active discount calculation
content = content.replace(
  /const discountAmount = Number\(localBooking\.discount_amount \|\| 0\);/,
  `const baseAmountForDiscount = Number(localBooking.total_price_at_booking || localBooking.total_amount);
    let discountAmount = 0;
    if (discountValue > 0) {
      discountAmount = discountType === 'percentage' ? (baseAmountForDiscount * discountValue) / 100 : discountValue;
    } else {
      discountAmount = Number(localBooking.discount_amount || 0);
    }`
);

content = content.replace(
  /handleAction\('complete', 'POST', \{/,
  `handleAction('complete', 'POST', {
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,`
);

// 4. Inject discount UI inside Financial Ledger
const uiHook = /<span className="text-wa-text font-bold">\{\(localBooking\.total_price_at_booking \|\| localBooking\.total_amount\)\} EGP<\/span>\n\s+<\/div>/;
const discountUI = `<span className="text-wa-text font-bold">{(localBooking.total_price_at_booking || localBooking.total_amount)} EGP</span>
                    </div>

                    {localBooking.status === 'confirmed' && (
                      <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-wa-green/20">
                        <span className="text-xs uppercase text-wa-text/60">Apply Discount</span>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            className="w-16 bg-transparent border-b border-wa-green/40 text-right text-wa-green font-mono text-sm focus:outline-none focus:border-wa-green"
                          />
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'flat' | 'percentage')}
                            className="bg-transparent text-xs text-wa-green focus:outline-none cursor-pointer"
                          >
                            <option value="flat">EGP</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                      </div>
                    )}
`;
content = content.replace(uiHook, discountUI);

// 5. Update discount visual ledger
content = content.replace(
  /\{Number\(localBooking\.discount_amount\) > 0 && \(/,
  `{(discountValue > 0 || Number(localBooking.discount_amount) > 0) && (`
);

content = content.replace(
  /<span className="text-wa-orange font-bold">-\{localBooking\.discount_amount\} EGP<\/span>/,
  `<span className="text-wa-orange font-bold">-{discountValue > 0 ? (discountType === 'percentage' ? ((Number(localBooking.total_price_at_booking || localBooking.total_amount) * discountValue) / 100) : discountValue) : localBooking.discount_amount} EGP</span>`
);

fs.writeFileSync(file, content);
console.log('patched view modal successfully');
