"""Seasonal sale windows 2026-2035 for the Saudi market (Umm al-Qura via hijri-converter):
 ramadan: 1 Ramadan .. 3 Shawwal ; national: 20-24 Sep ; founding: 20-23 Feb ; white: Wed before Black Friday .. Cyber Monday ;
 school: 15-31 Aug ; newyear (Hanzi Path only, Chinese New Year): eve-3 .. Lantern Festival"""
import json, datetime as dt
from hijri_converter import Hijri, Gregorian
out = []
def add(k, a, b): out.append([k, a.strftime('%Y%m%d'), b.strftime('%Y%m%d')])
for y in range(2026, 2036):
    hy = Gregorian(y, 6, 1).to_hijri().year
    for h in (hy - 1, hy, hy + 1):
        a = Hijri(h, 9, 1).to_gregorian(); b = Hijri(h, 10, 3).to_gregorian()
        if a.year == y: add('ramadan', a, b)
    add('founding', dt.date(y, 2, 20), dt.date(y, 2, 23)); add('national', dt.date(y, 9, 20), dt.date(y, 9, 24))
    add('school', dt.date(y, 8, 15), dt.date(y, 8, 31))
    nov1 = dt.date(y, 11, 1); th = nov1 + dt.timedelta(days=(3 - nov1.weekday()) % 7 + 21); bf = th + dt.timedelta(days=1)
    add('white', bf - dt.timedelta(days=2), bf + dt.timedelta(days=3))
from lunardate import LunarDate
for y in range(2026, 2036):
    sp = LunarDate(y, 1, 1).to_solar_date(); add('cny', sp - dt.timedelta(days=4), LunarDate(y, 1, 15).to_solar_date())
out.sort(key=lambda x: x[1])
print([x for x in out if x[1].startswith('2026') or x[1].startswith('2027')])
print('const SALES=' + json.dumps(out, separators=(',', ':')) + ';')  # paste into growth.js
#('const SALES=' + json.dumps(out, separators=(',', ':')) + ';\n')
