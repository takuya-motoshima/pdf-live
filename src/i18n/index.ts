import de from '~/i18n/de.json';
import en from '~/i18n/en.json';
import es from '~/i18n/es.json';
import fr from '~/i18n/fr.json';
import it from '~/i18n/it.json';
import ja from '~/i18n/ja.json';
import ko from '~/i18n/ko.json';
import nl from '~/i18n/nl.json';
import pt_br from '~/i18n/pt_br.json';
import ru from '~/i18n/ru.json';
import zh_cn from '~/i18n/zh_cn.json';
import zh_tw from '~/i18n/zh_tw.json';

export default (lang: string = 'en'): {[key: string]: any} => {
  const language = {de, en, es, fr, it, ja, ko, nl, pt_br, ru, zh_cn, zh_tw};
  if (!(lang in language))
    lang = 'en';
  return language[lang];
}