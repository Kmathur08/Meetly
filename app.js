const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

document.getElementById('join-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = event.currentTarget.querySelector('input').value.trim();
  showToast(code ? `Joining room ${code}...` : 'Enter a meeting code or link first.');
});

[['mic-btn', 'Microphone'], ['cam-btn', 'Camera']].forEach(([id, label]) => {
  const button = document.getElementById(id);
  button.addEventListener('click', () => {
    const isOn = button.classList.toggle('off') === false;
    button.setAttribute('aria-pressed', String(isOn));
    showToast(`${label} ${isOn ? 'on' : 'off'}.`);
  });
});

const menuButton = document.querySelector('.menu-toggle');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  document.querySelector('.desktop-nav').classList.toggle('mobile-open', !expanded);
});