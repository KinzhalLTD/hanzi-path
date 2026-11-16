import json,sys
from collections import deque
# pieces: (name,w,h,x,y); solved: Cao Cao at (1,3)
solved=[('曹操',2,2,1,3),('张飞',1,2,0,0),('赵云',1,2,3,0),('马超',1,2,0,2),('黄忠',1,2,3,2),('关羽',2,1,1,0),('兵',1,1,1,1),('兵',1,1,2,1),('兵',1,1,1,2),('兵',1,1,2,2)]
def key(P):
    g=[['.']*4 for _ in range(5)]
    for n,w,h,x,y in P:
        c='C' if w==2 and h==2 else 'H' if w==2 else 'V' if h==2 else 'S'
        for a in range(h):
            for b in range(w): g[y+a][x+b]=c
    return ''.join(''.join(r) for r in g)
def occ(P,skip):
    s=set()
    for i,(n,w,h,x,y) in enumerate(P):
        if i==skip: continue
        for a in range(h):
            for b in range(w): s.add((x+b,y+a))
    return s
def moves(P):
    for i,(n,w,h,x,y) in enumerate(P):
        o=occ(P,i)
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if nx<0 or ny<0 or nx+w>4 or ny+h>5: continue
            if any((nx+b,ny+a) in o for a in range(h) for b in range(w)): continue
            Q=list(P); Q[i]=(n,w,h,nx,ny); yield Q
classicP=[('曹操',2,2,1,0),('张飞',1,2,0,0),('赵云',1,2,3,0),('马超',1,2,0,2),('黄忠',1,2,3,2),('关羽',2,1,1,2),('兵',1,1,1,3),('兵',1,1,2,3),('兵',1,1,0,4),('兵',1,1,3,4)]
rep={key(classicP):tuple(classicP)}; q=deque([tuple(classicP)]); adj={}
while q:
    P=q.popleft(); kp=key(P); adj[kp]=[]
    for Q in moves(list(P)):
        k=key(Q); adj[kp].append(k)
        if k not in rep: rep[k]=tuple(Q); q.append(tuple(Q))
goal=lambda k: k[13:15]=='CC' and k[17:19]=='CC'
dist={k:0 for k in rep if goal(k)}; q=deque(dist)
while q:
    k=q.popleft()
    for n in adj[k]:
        if n not in dist: dist[n]=dist[k]+1; q.append(n)
print('states',len(rep),'goals',sum(1 for k in rep if goal(k)),'classic dist',dist[key(classicP)],'max',max(dist.values()))
out=[]
for target in (10,20,35,55,75):
    cands=sorted(k for k,d in dist.items() if d==target and rep[k][0][4]==0) or sorted(k for k,d in dist.items() if d==target)
    k=cands[len(cands)//2]; out.append({'d':target,'P':[dict(n=n,w=w,h=h,x=x,y=y,cc=1 if n=='曹操' else 0) for n,w,h,x,y in rep[k]]})
    print(target,len(cands),k)
json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False)
