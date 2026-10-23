const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbypBnJrxDlo8_g_Zj-gCTQqfRISBFWbvwR7JEX9BHOH5Lzr3xAVjmpPSgDg80mMxnY3ZQ/exec';
const formEl = document.querySelector('#surveyForm');

function postToSheet(payload) {
  let frame = document.querySelector('#sheets-submit-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'sheets-submit-frame'; frame.name = 'sheets-submit-frame'; frame.hidden = true;
    document.body.appendChild(frame);
  }
  const postForm = document.createElement('form');
  postForm.method = 'POST'; postForm.action = SHEETS_ENDPOINT; postForm.target = frame.name;
  postForm.hidden = true;
  const field = document.createElement('input');
  field.name = 'payload'; field.value = JSON.stringify(payload);
  postForm.appendChild(field); document.body.appendChild(postForm); postForm.submit(); postForm.remove();
}

function valueFor(question) {
  if (question.type === 'text' || question.type === 'textarea') return formEl.elements[question.id]?.value.trim() || '';
  if (question.type === 'single') return formEl.querySelector(`input[name="${question.id}"]:checked`)?.value || '';
  if (question.type === 'multiple') return [...formEl.querySelectorAll(`input[name="${question.id}"]:checked`)].map(x => x.value).join(' | ');
  if (question.type === 'table') {
    return (question.rows || '').split('|').filter(Boolean).map((row, i) => {
      const chosen = formEl.querySelector(`input[name="${question.id}_${i}"]:checked`)?.value || '';
      return `${row.trim()}: ${chosen}`;
    }).join(' · ');
  }
  return '';
}

function clearErrors() { formEl.querySelectorAll('.validation-error').forEach(x => x.remove()); formEl.querySelectorAll('.is-invalid').forEach(x => x.classList.remove('is-invalid')); }
function validate() {
  clearErrors(); let first = null;
  questions.forEach(question => {
    const card = formEl.querySelectorAll('.question-card')[questions.indexOf(question)];
    const answer = valueFor(question);
    const incompleteTable = question.type === 'table' && answer.split(' · ').some(x => x.endsWith(': '));
    if (question.required && (!answer || incompleteTable)) {
      card.classList.add('is-invalid'); card.insertAdjacentHTML('beforeend', '<p class="validation-error">Completa esta pregunta antes de enviar el formulario.</p>');
      first ||= card;
    }
  });
  if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; }
  return true;
}

function updateProgress() {
  const completed = questions.filter(q => {
    const answer = valueFor(q);
    return q.type === 'table' ? answer && !answer.split(' · ').some(x => x.endsWith(': ')) : Boolean(answer);
  }).length;
  const next = Math.min(completed + 1, questions.length);
  document.querySelector('#progressValue').textContent = String(next).padStart(2, '0');
  document.querySelector('#currentQuestion').textContent = next;
  document.querySelector('#progressBar').style.width = `${questions.length ? (completed / questions.length) * 100 : 0}%`;
}

function readableAnswers() {
  const output = {};
  questions.forEach(question => {
    if (question.type === 'table') {
      const rows = (question.rows || '').split('|').filter(Boolean);
      rows.forEach((row, i) => {
        output[`${question.title} — ${row.trim()}`] = formEl.querySelector(`input[name="${question.id}_${i}"]:checked`)?.value || '';
      });
    } else output[question.title] = valueFor(question);
  });
  return output;
}

formEl.addEventListener('input', updateProgress); formEl.addEventListener('change', updateProgress);
formEl.onsubmit = async event => {
  event.preventDefault(); if (!validate()) return;
  const payload = { submittedAt: new Date().toISOString(), answers: readableAnswers() };
  const button = formEl.querySelector('.form-submit'); button.disabled = true; button.textContent = 'Enviando…';
  postToSheet(payload);
  answers.push({ date: payload.submittedAt, answers: payload.answers }); localStorage.setItem('coco_responses', JSON.stringify(answers));
  document.querySelector('#formulario').hidden = true; document.querySelector('#success').hidden = false; results();
};

document.querySelector('#editButton').onclick = () => {
  document.querySelector('#editor').classList.add('open');
  document.querySelector('#editor').setAttribute('aria-hidden', 'false');
  edit(); results();
};
document.querySelector('#restart').addEventListener('click', updateProgress); updateProgress();
