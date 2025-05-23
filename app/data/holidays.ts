import type { Holiday, RestrictedHoliday } from "../types"

export const HOLIDAYS: Holiday[] = [
  { date: "2025-01-26", day: "Sunday", type: "Compulsory", name: "Republic Day", weekend: true },
  { date: "2025-02-26", day: "Wednesday", type: "Declared", name: "Maha Shivaratri", weekend: false },
  { date: "2025-03-14", day: "Friday", type: "Additional", name: "Holi", weekend: false },
  { date: "2025-03-31", day: "Monday", type: "Compulsory", name: "Idu'l Fitr", weekend: false },
  { date: "2025-04-10", day: "Thursday", type: "Compulsory", name: "Mahavir Jayanti", weekend: false },
  { date: "2025-04-14", day: "Monday", type: "Declared", name: "Birthday of Dr. B.R. Ambedkar", weekend: false },
  { date: "2025-04-18", day: "Friday", type: "Compulsory", name: "Good Friday", weekend: false },
  { date: "2025-05-12", day: "Monday", type: "Compulsory", name: "Buddha Purnima", weekend: false },
  { date: "2025-06-07", day: "Saturday", type: "Compulsory", name: "Id-uz-Zuha (Bakrid)", weekend: true },
  { date: "2025-07-06", day: "Sunday", type: "Compulsory", name: "Muharram", weekend: true },
  { date: "2025-08-15", day: "Friday", type: "Compulsory", name: "Independence Day", weekend: false },
  { date: "2025-08-27", day: "Wednesday", type: "Additional", name: "Ganesh Chaturthi / Vinayak Chaturthi", weekend: false },
  { date: "2025-09-05", day: "Friday", type: "Compulsory", name: "Id-E-Milad", weekend: false },
  { date: "2025-10-01", day: "Wednesday", type: "Additional", name: "Dussehra -Maha Navmi", weekend: false },
  { date: "2025-10-02", day: "Thursday", type: "Compulsory", name: "Mahatma Gandhi Jayanti and Dussehra", weekend: false },
  { date: "2025-10-20", day: "Monday", type: "Compulsory", name: "Diwali (Deepavali)", weekend: false },
  { date: "2025-11-05", day: "Wednesday", type: "Compulsory", name: "Birthday of Guru Nanak", weekend: false },
  { date: "2025-12-25", day: "Thursday", type: "Compulsory", name: "Christmas", weekend: false },
]

export const RESTRICTED_HOLIDAYS: RestrictedHoliday[] = [
  { date: "2025-01-01", day: "Wednesday", name: "New Year Day" },
  { date: "2025-01-06", day: "Monday", name: "Birthday of Guru Gobind Singh" },
  { date: "2025-01-14", day: "Tuesday", name: "Makar Sankranti / Magha Bihu / Pongal / Birth Day of Hazarat Ali" },
  { date: "2025-02-02", day: "Sunday", name: "Basant Panchami / Sri Panchami" },
  { date: "2025-02-12", day: "Wednesday", name: "Birth Day of Guru Ravi Das" },
  { date: "2025-02-19", day: "Wednesday", name: "Chattrapati Shivaji Maharaj Jayanti" },
  { date: "2025-02-23", day: "Sunday", name: "Birthday of Swami Dayananda Saraswati" },
  { date: "2025-03-13", day: "Thursday", name: "Holika Dahan" },
  { date: "2025-03-28", day: "Friday", name: "Jamat Ul Vida" },
  { date: "2025-03-30", day: "Sunday", name: "Chaitra Sukladi/Gudi Padava/Ugadi/Cheti Chand" },
  { date: "2025-04-06", day: "Sunday", name: "Ram Navmi" },
  { date: "2025-04-13", day: "Sunday", name: "Vaisakhi / Vishu" },
  { date: "2025-04-15", day: "Tuesday", name: "Vaisakhadi (Bengal) / Bahag Bihu (Assam)" },
  { date: "2025-04-20", day: "Sunday", name: "Easter Sunday" },
  { date: "2025-05-09", day: "Friday", name: "Birthday of Guru Rabindranath" },
  { date: "2025-06-27", day: "Friday", name: "Rath Yatra" },
  { date: "2025-08-09", day: "Saturday", name: "Raksha Bandhan" },
  { date: "2025-09-29", day: "Monday", name: "Dussehra (Saptami)" },
  { date: "2025-09-30", day: "Tuesday", name: "Dussehra (Mahashtami)" },
  { date: "2025-10-07", day: "Tuesday", name: "Birthday of Maharishi Valmiki" },
  { date: "2025-10-10", day: "Friday", name: "Karaka Chaturthi (Karwa Chouth)" },
  { date: "2025-10-22", day: "Wednesday", name: "Govardhan Puja" },
  { date: "2025-10-23", day: "Thursday", name: "Bhai Duj" },
  { date: "2025-10-28", day: "Tuesday", name: "Pratihar Shashthi or Surya Shashthi (Chhat Puja)" },
  { date: "2025-11-24", day: "Monday", name: "Guru Tegh bahadur Martyrdom day" },
  { date: "2025-12-24", day: "Wednesday", name: "Christmas Eve" },
]
