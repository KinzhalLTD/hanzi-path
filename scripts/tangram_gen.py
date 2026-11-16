import json, sys, math, random, itertools
from shapely.geometry import Polygon
from shapely.ops import unary_union
from PIL import Image, ImageDraw
out = sys.argv[1]
SQ = {'L1':[(0,0),(8,0),(4,4)],'L2':[(0,0),(4,4),(0,8)],'S1':[(8,0),(8,4),(6,2)],'Q':[(6,2),(8,4),(6,6),(4,4)],
      'S2':[(4,4),(6,6),(2,6)],'P':[(0,8),(2,6),(6,6),(4,8)],'M':[(8,4),(8,8),(4,8)]}
def valid(fig):
    ps=[Polygon(v) for v in fig.values()]
    for a,b in itertools.combinations(ps,2):
        if a.intersection(b).area>1e-6: return False
    u=unary_union(ps)
    return abs(u.area-64)<1e-6 and u.geom_type=='Polygon' and len(u.interiors)==0
def edges(poly):
    return [(poly[i],poly[(i+1)%len(poly)]) for i in range(len(poly))]
def L(a,b): return math.dist(a,b)
def place(piece, pe, te):
    # map piece edge pe=(p0,p1) onto target edge te reversed (t1->t0) so piece lies outside
    (p0,p1),(t0,t1)=pe,te
    a1=math.atan2(p1[1]-p0[1],p1[0]-p0[0]); a2=math.atan2(t0[1]-t1[1],t0[0]-t1[0]); r=a2-a1
    c,s=math.cos(r),math.sin(r)
    res=[]
    for x,y in piece:
        x-=p0[0]; y-=p0[1]; X=x*c-y*s+t1[0]; Y=x*s+y*c+t1[1]; res.append((round(X,4),round(Y,4)))
    return res
def boundary_edges(fig):
    u=unary_union([Polygon(v) for v in fig.values()]).simplify(0)
    gs=list(u.geoms) if u.geom_type=='MultiPolygon' else [u]
    out=[]
    for g in gs:
        c=list(g.exterior.coords)[:-1]; out+=[(c[i],c[(i+1)%len(c)]) for i in range(len(c))]
    return out
cands=[]
random.seed(7)
def move(fig, name):
    rest={k:v for k,v in fig.items() if k!=name}
    res=[]
    for te in boundary_edges(rest):
        for pe in edges(fig[name]):
            lt,lp=L(*te),L(*pe)
            if lp<=lt+1e-6:
              step=lp/2; n=int(round((lt-lp)/step))
              for k in range(n+1):
                ux,uy=(te[0][0]-te[1][0])/lt,(te[0][1]-te[1][1])/lt
                s1=(te[1][0]+ux*k*step,te[1][1]+uy*k*step); s0=(s1[0]+ux*lp,s1[1]+uy*lp)
                sub=(s0,s1)
                for flip in (False,True):
                    poly=fig[name] if not flip else [(-x,y) for x,y in fig[name]]
                    pe2=pe if not flip else ((-pe[0][0],pe[0][1]),(-pe[1][0],pe[1][1]))
                    if flip and name not in ('P',): continue
                    new=dict(rest); new[name]=place(poly,pe2,sub)
                    if valid(new): res.append(new)
    return res
for n in SQ:
    for f in move(SQ,n): cands.append((n,f))
# two-piece moves
two=[]
for n1,f1 in cands:
    for n2 in SQ:
        if n2<=n1: continue
        for f2 in move(f1,n2): two.append((n1+n2,f2))
random.shuffle(two); random.shuffle(cands)
allc=cands[:40]+two[:60]
json.dump([{'k':k,'f':f} for k,f in allc],open(out+'/cands.json','w'))
# render sheet
cell=110; cols=10; rows=math.ceil(len(allc)/cols)
img=Image.new('RGB',(cols*cell,rows*cell),'white'); d=ImageDraw.Draw(img)
for i,(k,f) in enumerate(allc):
    u=unary_union([Polygon(v) for v in f.values()]); minx,miny,maxx,maxy=u.bounds; sc=min(90/(maxx-minx),90/(maxy-miny))
    ox=(i%cols)*cell+10; oy=(i//cols)*cell+12
    for v in f.values():
        d.polygon([(ox+(x-minx)*sc,oy+(y-miny)*sc) for x,y in v],fill=(40,40,40),outline=(255,255,255))
    d.text(((i%cols)*cell+2,(i//cols)*cell),str(i),fill=(200,0,0))
img.save(out+'/sheet.png'); print(len(cands),'single',len(two),'double')
