/*
 * Site-wide settings for the static forms.
 * Everything here is public (it ships to every browser), so never put secrets here.
 *
 * web3formsAccessKey: create a free key at https://web3forms.com (enter the inbox
 *   that should receive requests). Web3Forms access keys are designed to be public.
 *   Until a real key is set, forms fall back to opening the visitor's email app.
 * hcaptchaSiteKey: Web3Forms' shared free-plan hCaptcha site key. Custom keys need a paid plan.
 * requestEmail: split in two so simple scrapers can't harvest it from the source.
 * See docs/forms-and-captcha-guide.md for the full setup.
 */
window.SITE_CONFIG = {
    web3formsAccessKey: 'b6298096-a7a3-464e-9946-af1c8e5dfcc8',
    hcaptchaSiteKey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2',
    requestEmail: ['codermpendulo', 'gmail.com']
};
