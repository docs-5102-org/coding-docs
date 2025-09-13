---
title: Maven 安装jar包到本地仓库
category:
  - Maven
---


## 安装第三方jar或自定义jar到本地仓库


```bash
#指定仓库的路径 **git bash命令行**
-Dmaven.repo.local=/e/.m2/repository

mvn install:install-file -Dmaven.repo.local=/e/.m2/repository -Dfile=ckfinderplugin-fileeditor-2.3.jar -DgroupId=com.ckfinder -DartifactId=ckfinderplugin-fileeditor -Dversion=2.3 -Dpackaging=jar

mvn install:install-file -Dmaven.repo.local=/e/.m2/repository -Dfile=shardingsphere-jdbc-core-5.4.0.jar -DgroupId=org.apache.shardingsphere -DartifactId=sharding-jdbc-core -Dversion=5.4.0 -Dpackaging=jar

#指定仓库的路径 **windows cmd命令行**
-Dmaven.repo.local=E:\.m2\repository

mvn install:install-file -Dmaven.repo.local=E:\.m2\repository -Dfile=shardingsphere-jdbc-core-5.4.0.jar -DgroupId=org.apache.shardingsphere -DartifactId=sharding-jdbc-core -Dversion=5.4.0 -Dpackaging=jar

#指定仓库的路径 **linux** 
-Dmaven.repo.local=/data/maven/repository

mvn install:install-file -Dmaven.repo.local=/data/maven/repository -Dfile=apache-ant-zip-2.3.jar -DgroupId=com.ckfinder -DartifactId=apache-ant-zip -Dversion=2.3 -Dpackaging=jar

mvn install:install-file -Dmaven.repo.local=/data/maven/repository -Dfile=ckfinderplugin-imageresize-2.3.jar -DgroupId=com.ckfinder -DartifactId=ckfinderplugin-imageresize -Dversion=2.3 -Dpackaging=jar

mvn install:install-file -Dmaven.repo.local=/data/maven/repository -Dfile=CKFinder-2.3.jar -DgroupId=com.ckfinder -DartifactId=CKFinder -Dversion=2.3 -Dpackaging=jar

mvn install:install-file -Dmaven.repo.local=/data/maven/repository -Dfile=ckfinderplugin-fileeditor-2.3.jar -DgroupId=com.ckfinder -DartifactId=ckfinderplugin-fileeditor -Dversion=2.3 -Dpackaging=jar
```