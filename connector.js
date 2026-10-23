// Envío de respuestas a Google Sheets mediante Apps Script.
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwRpSVwcas3hrJaUonWjfaCDPiogyd6ICERJGpgvoMyeHtir3y3oq9hX2J_vgVbNUeu/exec';

document.querySelector('#surveyForm').onsubmit = async event => {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;

  const values = {};
  for (const [key, value] of new FormData(form)) {
    values[key] = values[key] ? `${values[key]} | ${value}` : value;
  }

  const payload = { answers: values, submittedAt: new Date().toISOString() };
  try {
    await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('No se ha podido confirmar el envío remoto.', error);
  }

  answers.push({ date: payload.submittedAt, answers: values });
  localStorage.setItem('coco_responses', JSON.stringify(answers));
  document.querySelector('#formulario').hidden = true;
  document.querySelector('#success').hidden = false;
  results();
};
