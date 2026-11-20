import json, datetime as dt, ephem, math
from lunardate import LunarDate
def term(year, lon):
    # find date (China time UTC+8) when sun's apparent ecliptic longitude reaches lon degrees
    d = ephem.Date(f'{year}/1/1')
    t0 = dt.datetime(year,1,1)
    for day in range(0, 370):
        a = ephem.Date(t0 + dt.timedelta(days=day)); b = ephem.Date(t0 + dt.timedelta(days=day+1))
        def L(x): s=ephem.Sun(x); return math.degrees(ephem.Ecliptic(s, epoch=x).lon)
        la, lb = L(a), L(b)
        if (la - lon) % 360 > 300 and (lb - lon) % 360 < 60:
            lo, hi = a, b
            for _ in range(40):
                mid = ephem.Date((lo+hi)/2)
                if (L(mid) - lon) % 360 > 180: lo = mid
                else: hi = mid
            return (ephem.Date(hi).datetime() + dt.timedelta(hours=8)).date()
out = {}
LUN = {'spring':(1,1),'lantern':(1,15),'dragon':(5,5),'qixi':(7,7),'midautumn':(8,15),'chongyang':(9,9),'laba':(12,8)}
for y in range(2026, 2041):
    r = {}
    for k,(m,d) in LUN.items(): r[k] = LunarDate(y,m,d).toSolarDate().isoformat()
    r['eve'] = (LunarDate(y,1,1).toSolarDate() - dt.timedelta(days=1)).isoformat()
    r['qingming'] = term(y, 15).isoformat(); r['dongzhi'] = term(y, 270).isoformat()
    out[y] = r
print(json.dumps(out[2026], indent=0)); print(out[2027]['spring'], out[2027]['eve'], out[2028]['midautumn'])
json.dump(out, open('dates.json','w'))
