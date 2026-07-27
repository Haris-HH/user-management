import "dayjs/locale/th";
import Dayjs, { Dayjs as DayjsType } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

Dayjs.locale("th");

export default class buddhistEraAdapter extends AdapterDayjs {
  // The base constructor is inherited as-is; the previous override only
  // forwarded { locale, formats } and dropped any other adapter options.

  formatByString = (date: DayjsType, format: string): string => {
    const d = Dayjs(date);
    const buddhistYear = d.year() + 543;
    return d.format(format.replace("YYYY", String(buddhistYear)));
  };
}