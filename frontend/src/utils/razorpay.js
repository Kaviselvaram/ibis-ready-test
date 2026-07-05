// Loads the Razorpay Checkout script on demand (only when a user actually starts
// a payment) so it never affects initial page load. Resolves true once ready.
let loadingPromise = null;

export function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => { loadingPromise = null; resolve(false); };
    document.body.appendChild(script);
  });
  return loadingPromise;
}
