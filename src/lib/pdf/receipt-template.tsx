import React from 'react';

/**
 * Tactical Receipt Props
 */
export interface ReceiptProps {
  bookingCode: string;
  gameTitle: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  playerCount: number;
  totalPrice: number;
  depositAmount: number;
  currencyCode: string;
  whatsappNumber: string;
  instapayId: string;
  locale: 'en' | 'ar';
  qrCodeDataUrl: string;
}

/**
 * Warriors Arena Tactical Receipt Template
 * Rendered server-side to static HTML via ReactDOMServer.
 * Uses inline CSS only for Puppeteer compatibility.
 */
export const ReceiptTemplate: React.FC<ReceiptProps> = ({
  bookingCode,
  gameTitle,
  bookingDate,
  startTime,
  endTime,
  duration,
  playerCount,
  totalPrice,
  depositAmount,
  currencyCode,
  whatsappNumber,
  instapayId,
  locale,
  qrCodeDataUrl,
}) => {
  const isRtl = locale === 'ar';
  
  // Colors from Warriors Design System
  const colors = {
    green: '#8FE04A',
    orange: '#FF7A1A',
    black: '#0a0d0a',
    panel: '#161b18',
    text: '#eef1ea',
    textDim: '#9aa59a',
    bg: '#0a0d0a',
  };

  const labels = {
    en: {
      title: 'TACTICAL RECEIPT',
      mission: 'MISSION',
      code: 'BOOKING CODE',
      date: 'DATE',
      time: 'TIME',
      duration: 'DURATION',
      squad: 'SQUAD SIZE',
      players: 'players',
      pricing: 'PRICING',
      pricePerPlayer: 'Price per player',
      subtotal: 'SUBTOTAL',
      deposit: 'DEPOSIT (REQUIRED)',
      balance: 'BALANCE ON ARRIVAL',
      instructions: 'PAYMENT INSTRUCTIONS',
      instapay: 'InstaPay ID',
      whatsapp: 'WhatsApp',
      noticeTitle: 'IMPORTANT NOTICE',
      noticeText: 'Warriors Arena is located inside Merryland Park. A small park entrance fee applies at the gate.',
      cancellation: 'Cancellations within 24 hours forfeit the deposit.',
      footer: 'Thank you for choosing Warriors Arena. We\'ll see you in the arena!',
    },
    ar: {
      title: 'إيصال تكتيكي',
      mission: 'المهمة',
      code: 'رمز الحجز',
      date: 'التاريخ',
      time: 'الوقت',
      duration: 'المدة',
      squad: 'حجم الفريق',
      players: 'لاعبين',
      pricing: 'التسعير',
      pricePerPlayer: 'سعر اللاعب',
      subtotal: 'المجموع الفرعي',
      deposit: 'العربون (مطلوب)',
      balance: 'المبلغ المتبقي عند الوصول',
      instructions: 'تعليمات الدفع',
      instapay: 'معرف إنستا باي',
      whatsapp: 'واتساب',
      noticeTitle: 'ملاحظة هامة',
      noticeText: 'تقع واريورز أرينا داخل حديقة ميري لاند. يتم تطبيق رسوم دخول رمزية للحديقة عند البوابة.',
      cancellation: 'الإلغاء قبل أقل من ٢٤ ساعة يؤدي إلى خسارة العربون.',
      footer: 'شكراً لاختياركم واريورز أرينا. نراكم في الساحة!',
    }
  }[locale];

  const pricePerPlayer = totalPrice / playerCount;
  const balance = totalPrice - depositAmount;

  const containerStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    margin: '0 auto',
    padding: '40px',
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    direction: isRtl ? 'rtl' : 'ltr',
    boxSizing: 'border-box',
    border: `1px solid ${colors.panel}`,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    borderBottom: `2px solid ${colors.green}`,
    paddingBottom: '20px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '30px',
    backgroundColor: colors.panel,
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #2a322c',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    letterSpacing: '0.2em',
    color: colors.green,
    fontWeight: 'bold',
    marginBottom: '10px',
    textTransform: 'uppercase',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.text,
  };

  const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: colors.text, letterSpacing: '-0.02em' }}>
            WARRIORS<span style={{ color: colors.green }}>ARENA</span>
          </div>
          <div style={{ fontSize: '12px', color: colors.textDim, marginTop: '4px', letterSpacing: '0.1em' }}>
            {labels.title}
          </div>
        </div>
        <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
          <div style={titleStyle}>{labels.code}</div>
          <div style={{ ...valueStyle, fontSize: '42px', color: colors.green }}>{bookingCode}</div>
        </div>
      </div>

      {/* MISSION DETAILS */}
      <div style={sectionStyle}>
        <div style={titleStyle}>{labels.mission}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ color: colors.textDim, fontSize: '12px' }}>{labels.mission}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{gameTitle}</div>
          </div>
          <div>
            <div style={{ color: colors.textDim, fontSize: '12px' }}>{labels.date}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{bookingDate}</div>
          </div>
          <div>
            <div style={{ color: colors.textDim, fontSize: '12px' }}>{labels.time}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{startTime} - {endTime}</div>
          </div>
          <div>
            <div style={{ color: colors.textDim, fontSize: '12px' }}>{labels.duration}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{duration}</div>
          </div>
          <div>
            <div style={{ color: colors.textDim, fontSize: '12px' }}>{labels.squad}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{playerCount} {labels.players}</div>
          </div>
        </div>
      </div>

      {/* PRICING BREAKDOWN */}
      <div style={sectionStyle}>
        <div style={titleStyle}>{labels.pricing}</div>
        <div style={detailRowStyle}>
          <span style={{ color: colors.textDim }}>{labels.pricePerPlayer}</span>
          <span style={{ fontWeight: 'bold' }}>{pricePerPlayer} {currencyCode}</span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: colors.textDim }}>{labels.subtotal}</span>
          <span style={{ fontWeight: 'bold' }}>{totalPrice} {currencyCode}</span>
        </div>
        <div style={{ ...detailRowStyle, marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(143,224,74,0.1)', border: `1px solid ${colors.green}` }}>
          <span style={{ color: colors.green, fontWeight: 'bold' }}>{labels.deposit}</span>
          <span style={{ color: colors.green, fontWeight: 'bold', fontSize: '18px' }}>{depositAmount} {currencyCode}</span>
        </div>
        <div style={{ ...detailRowStyle, marginTop: '8px', padding: '12px 16px', backgroundColor: 'rgba(255,122,26,0.1)', border: '1px solid #FF7A1A' }}>
          <span style={{ color: colors.orange, fontWeight: 'bold' }}>{labels.balance}</span>
          <span style={{ color: colors.orange, fontWeight: 'bold', fontSize: '18px' }}>{balance} {currencyCode}</span>
        </div>
      </div>

      {/* PAYMENT & NOTICE */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ ...sectionStyle, flex: 2, marginBottom: 0 }}>
          <div style={titleStyle}>{labels.instructions}</div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: colors.textDim, fontSize: '11px' }}>{labels.instapay}</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.green }}>{instapayId}</div>
          </div>
          <div>
            <div style={{ color: colors.textDim, fontSize: '11px' }}>{labels.whatsapp}</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{whatsappNumber}</div>
          </div>
        </div>
        <div style={{ ...sectionStyle, flex: 3, backgroundColor: 'rgba(255,122,26,0.1)', border: `1px solid ${colors.orange}`, color: colors.orange, marginBottom: 0 }}>
          <div style={{ ...titleStyle, color: colors.orange }}>{labels.noticeTitle}</div>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{labels.noticeText}</div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', color: colors.textDim, marginBottom: '20px', maxWidth: '300px' }}>
            * {labels.cancellation}
          </p>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.green }}>
            {labels.footer}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          {qrCodeDataUrl && (
            <img 
              src={qrCodeDataUrl} 
              alt="Booking QR" 
              style={{ width: '120px', height: '120px', border: '4px solid white', borderRadius: '4px' }}
            />
          )}
          <div style={{ fontSize: '10px', color: colors.textDim, marginTop: '8px', letterSpacing: '0.1em' }}>
            SCAN TO MANAGE
          </div>
        </div>
      </div>
    </div>
  );
};
