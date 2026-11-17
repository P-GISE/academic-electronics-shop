// Static functions replace inline handlers under the script policy.
const shopHandlers = {
  customerSupport: function (event) { sing() },
  cart: function (event) { hhh() },
  signIn: function (event) { log() },
  selectColor: function (event) { toggleButton(this) },
  validateSelection: function (event) { validateSelection() },
  blockSubmit: function (event) { return false; },
  processPayment: function (event) { processPayment() },
  goToMain: function (event) { redirectToMain() },
  logout: function (event) { logout() },
  samsungPopup: function (event) { showContent('samsung'); openPopup() },
  appleFind: function (event) { showContent('apple'); fing() },
  appleSupport: function (event) { showContent('apple'); sing() },
  login: function (event) { login() },
  checkCartItem: function (event) { basket.checkItem(); },
  changeFirstQuantity: function (event) { basket.changePNum(1); },
  deleteCartItem: function (event) { basket.delItem(); },
  changeSecondQuantity: function (event) { basket.changePNum(2); },
  changeThirdQuantity: function (event) { basket.changePNum(3); },
  deleteCheckedItems: function (event) { basket.delCheckedItem(); },
  emptyCart: function (event) { basket.delAllItem(); },
  showSamsung: function (event) { showContent('samsung') },
  showApple: function (event) { showContent('apple') },
  showXiaomi: function (event) { showContent('xiaomi') },
};
for (const eventName of ['click', 'keyup', 'submit']) {
  for (const element of document.querySelectorAll('[data-on' + eventName + ']')) {
    element['on' + eventName] = shopHandlers[element.getAttribute('data-on' + eventName)];
  }
}
for (const link of document.querySelectorAll('[data-prevent-navigation]')) {
  link.addEventListener('click', event => event.preventDefault());
}
