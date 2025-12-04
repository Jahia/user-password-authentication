#!/bin/bash
source ./set-env.sh

docker logs smtp-server > ./artifacts/results/smtp-server.log

echo " == Collecting JacCoCo execution data =="

docker cp jahia:/jacoco-data/jacoco-cypress.exec ./artifacts/results/jacoco-cypress.exec

echo " == Generating JaCoCo Cypress report =="

(cd .. && mvn compile org.jacoco:jacoco-maven-plugin:report -Djacoco.dataFile=tests/artifacts/results/jacoco-cypress.exec && mv target/site/jacoco target/site/jacoco-cypress)

echo " == Creating JaCoCo report archive =="

# Create zip archive with classifier
(cd ../target/site && zip -r jacoco-cypress-report.zip jacoco-cypress)

echo " == Uploading to Nexus =="

# Retrieve Maven properties
GROUP_ID=$(cd .. && mvn help:evaluate -Dexpression=project.groupId -q -DforceStdout)
ARTIFACT_ID=$(cd .. && mvn help:evaluate -Dexpression=project.artifactId -q -DforceStdout)
VERSION=$(cd .. && mvn help:evaluate -Dexpression=project.version -q -DforceStdout)

# TODO
ls -al -R
