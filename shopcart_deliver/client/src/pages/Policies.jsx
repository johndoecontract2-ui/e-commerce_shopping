export default function Policies() {
  return (
    <div className="wrap policies">
      <span className="eyebrow">Transparency</span>
      <h1 className="shop__title">Policies & your rights</h1>

      <section id="shipping" className="policy">
        <h2 className="serif policy__h">Shipping & returns</h2>
        <p>
          Orders are dispatched within 2 business days. Shipping is free on orders
          over ₹999; otherwise a flat ₹79 applies and is always shown before
          checkout. You can return most items within 7 days of delivery for a full
          refund, processed automatically to your original payment method.
        </p>
        <p>
          We never charge a cancellation fee unless we'd bear the same fee were we
          to cancel your order — in line with the Consumer Protection (E-Commerce)
          Rules, 2020.
        </p>
      </section>

      <section id="privacy" className="policy">
        <h2 className="serif policy__h">Privacy notice</h2>
        <p>
          We collect only the data needed to fulfil your order: your name, contact
          details, and shipping address. Marketing and analytics are strictly
          opt-in, never bundled with your purchase, and reversible any time from
          your account — as required by the Digital Personal Data Protection Act,
          2023.
        </p>
        <p>
          We are the Data Fiduciary for your personal data. We never sell it, and
          we hold it only as long as needed for the purpose you consented to.
        </p>
      </section>

      <section id="grievance" className="policy">
        <h2 className="serif policy__h">Grievance redressal</h2>
        <p>
          If something's gone wrong, contact our Grievance Officer. We acknowledge
          every complaint within 48 hours and resolve it within 30 days.
        </p>
        <div className="policy__card mono">
          <strong>Grievance Officer</strong><br />
          Priya Nair<br />
          ShopCart Retail Pvt. Ltd.<br />
          4th Floor, Prestige Tower, MG Road, Bengaluru 560001<br />
          <a href="mailto:grievance@shopcart.dev">grievance@shopcart.dev</a>
        </div>
      </section>
    </div>
  );
}
