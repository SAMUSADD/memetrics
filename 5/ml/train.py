import os, numpy as np, joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

rng = np.random.default_rng(11)
N=6000
skills = rng.beta(3,2,size=N)
learning = rng.beta(2.5,2,size=N)
certs = rng.poisson(1.4, size=N)
projects = rng.beta(2.2,2.2,size=N)
finance = rng.beta(2.0,2.0,size=N)
resilience = rng.beta(3.0,1.8,size=N)
X = np.vstack([skills,learning,certs,projects,finance,resilience]).T

target = 0.28*skills + 0.22*learning + 0.12*np.tanh(certs/5) + 0.18*projects + 0.12*finance + 0.08*resilience
y = np.clip(target + rng.normal(0,0.035,size=N), 0, 1)

Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.2,random_state=11)
model=GradientBoostingRegressor(random_state=11).fit(Xtr,ytr)
print("R^2:", round(r2_score(yte, model.predict(Xte)),4))

out = {"model": model}
dst = os.path.join(os.path.dirname(__file__), "..", "backend", "model.pkl")
joblib.dump(out, dst)
print("Saved model to:", dst)
