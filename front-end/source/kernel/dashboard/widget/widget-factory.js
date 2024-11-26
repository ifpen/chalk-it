// ┌────────────────────────────────────────────────────────────────────┐ \\
// │  widgetFactory : absract factory class for buidling widgets        │ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import PNotify from 'pnotify';

const POSSIBLE_ANSI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // (62 characters)
const POSSIBLE_HINDI = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ'; // Hindi chars (34 characters)
const POSSIBLE_DEVANAGARI = 'अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह'; // Devanagari chars (46 characters)
const POSSIBLE_JAPANESE =
  'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'; // Japanese chars (46 characters)
const POSSIBLE_RUSSIAN = 'БГДЁЖИЙЛПФЦЧШЩЪЫЭЮЯ'; // 33 characters
const POSSIBLE_ARABIC = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'; // 28 characters
const POSSIBLE_HEBREW = 'אבגדהוזחטיכךלמםנןסעפףצץקרשת'; // 22 characters
const POSSIBLE_GREEK = 'βΓΔδεζηΘθκΛλμΞξΠπΣτΦφχΨψΩω'; // 24 characters
const POSSIBLE_CHINESE = '一二三四五六七八九十百千万亿中人天地日月金木水火风雷'; // 26 characters
const POSSIBLE_IDS = [
  ...POSSIBLE_ANSI,
  ...POSSIBLE_HINDI,
  ...POSSIBLE_DEVANAGARI,
  ...POSSIBLE_JAPANESE,
  ...POSSIBLE_RUSSIAN,
  ...POSSIBLE_ARABIC,
  ...POSSIBLE_HEBREW,
  ...POSSIBLE_GREEK,
  ...POSSIBLE_CHINESE,
];

/**
 * @description Creates unique instanceId (for edit, play and (se/dese)rialization)
 * @param {string} modelJsonId
 * @param {function(string):boolean} isIdUsed
 * @returns {string}
 */
export function createUniqueInstanceId(modelJsonId, isIdUsed) {
  for (const c of POSSIBLE_IDS) {
    const instanceId = modelJsonId + c;
    if (!isIdUsed(instanceId)) {
      return instanceId;
    }
  }

  // handle case where all possible IDs are taken
  const notice = new PNotify({
    title: 'Annotation label',
    text: 'The number of label instances is reached',
    type: 'warning',
    delay: 1800,
    styling: 'bootstrap3',
  });
  $('.ui-pnotify-container').on('click', function () {
    notice.remove();
  });

  throw new Error('The number of label instances is reached');
}
