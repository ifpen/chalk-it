from sklearn.ensemble import RandomForestClassifier

def classifier(dataNodes):
    clf=RandomForestClassifier()
    clf.fit(dataNodes["dataset"].data,dataNodes["dataset"].target)
    return clf
