"""List quiz questions / quick checks whose right answer is clearly the longest option (a give-away).
Usage: python3 -I scripts/qa_bias.py ROOT [--dump TRACKPREFIX]"""
import glob, sys, os
R = sys.argv[1]
def load():
    cur=None; Q=[]; C=[]; qi={}
    for f in sorted(glob.glob(os.path.join(R,'content/mod_*.tsv')))+sorted(glob.glob(os.path.join(R,'content/fun_*.tsv'))):
        for n,ln in enumerate(open(f,encoding='utf-8')):
            ln=ln.rstrip('\n')
            if ln[:1] in '@+': cur=ln[1:].split('|')[0].strip()
            elif ln.startswith('Q|'):
                i=qi.get(cur,0); qi[cur]=i+1; Q.append((f'{cur}#{i}',f,n,ln.split('|')))
            elif ln.startswith('C|'):
                x=ln.split('|'); C.append((f'{cur}@{x[1]}',f,n,x))
    return Q,C
def biased(opts):
    L=[len(o) for o in opts]; return L[0]==max(L) and L[0]>1.3*sorted(L)[-2]
if __name__=='__main__':
    Q,C=load()
    bq=[q for q in Q if biased([q[3][4],q[3][6],q[3][8],q[3][10]])]
    bc=[c for c in C if biased([c[3][5],c[3][7],c[3][9]])]
    print('biased Q',len(bq),'/',len(Q),' C',len(bc),'/',len(C))
    if '--dump' in sys.argv:
        p=sys.argv[sys.argv.index('--dump')+1]
        for k,f,n,x in bq:
            if k.startswith(p): print(f'{k}|{x[2]}|R:{x[4]}|{x[6]}|{x[8]}|{x[10]}')
        for k,f,n,x in bc:
            if k.startswith(p): print(f'{k}|{x[3]}|R:{x[5]}|{x[7]}|{x[9]}')
