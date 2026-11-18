import { en, type Messages } from './en';
import type { Language } from './languages';
import ar from './locales/ar.json';
import bg from './locales/bg.json';
import bn from './locales/bn.json';
import bs from './locales/bs.json';
import cs from './locales/cs.json';
import da from './locales/da.json';
import de from './locales/de.json';
import el from './locales/el.json';
import es from './locales/es.json';
import esMx from './locales/es-mx.json';
import et from './locales/et.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import fa from './locales/fa.json';
import ga from './locales/ga.json';
import he from './locales/he.json';
import hi from './locales/hi.json';
import hr from './locales/hr.json';
import hu from './locales/hu.json';
import id from './locales/id.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import lt from './locales/lt.json';
import lv from './locales/lv.json';
import mk from './locales/mk.json';
import ms from './locales/ms.json';
import mt from './locales/mt.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ptBr from './locales/pt-br.json';
import ro from './locales/ro.json';
import ru from './locales/ru.json';
import sk from './locales/sk.json';
import sl from './locales/sl.json';
import sq from './locales/sq.json';
import srCy from './locales/sr-cy.json';
import sr from './locales/sr.json';
import sv from './locales/sv.json';
import th from './locales/th.json';
import tr from './locales/tr.json';
import uk from './locales/uk.json';
import vi from './locales/vi.json';
import zh from './locales/zh.json';

function pack(data: Partial<Messages>): Messages {
  const filled: Messages = { ...en };
  for (const key of Object.keys(en) as (keyof Messages)[]) {
    const value = data[key];
    if (typeof value === 'string' && value.length > 0) filled[key] = value;
  }
  return filled;
}

export const catalogs: Record<Language, Messages> = {
  en,
  'ar': pack(ar),
  'bg': pack(bg),
  'bn': pack(bn),
  'bs': pack(bs),
  'cs': pack(cs),
  'da': pack(da),
  'de': pack(de),
  'el': pack(el),
  'es': pack(es),
  'es-mx': pack(esMx),
  'et': pack(et),
  'fi': pack(fi),
  'fr': pack(fr),
  'fa': pack(fa),
  'ga': pack(ga),
  'he': pack(he),
  'hi': pack(hi),
  'hr': pack(hr),
  'hu': pack(hu),
  'id': pack(id),
  'it': pack(it),
  'ja': pack(ja),
  'ko': pack(ko),
  'lt': pack(lt),
  'lv': pack(lv),
  'mk': pack(mk),
  'ms': pack(ms),
  'mt': pack(mt),
  'nl': pack(nl),
  'pl': pack(pl),
  'pt': pack(pt),
  'pt-br': pack(ptBr),
  'ro': pack(ro),
  'ru': pack(ru),
  'sk': pack(sk),
  'sl': pack(sl),
  'sq': pack(sq),
  'sr-cy': pack(srCy),
  'sr': pack(sr),
  'sv': pack(sv),
  'th': pack(th),
  'tr': pack(tr),
  'uk': pack(uk),
  'vi': pack(vi),
  'zh': pack(zh),
};
