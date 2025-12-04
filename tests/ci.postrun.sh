#!/bin/bash
source ./set-env.sh

docker logs smtp-server > ./artifacts/results/smtp-server.log

echo " == Collecting JacCoCo execution data =="

docker cp jahia:/jacoco-data/jacoco-cypress.exec ./artifacts/results/jacoco-cypress.exec

echo " == Generating JaCoCo Cypress report =="

(cd .. && mvn compile org.jacoco:jacoco-maven-plugin:report -Djacoco.dataFile=tests/artifacts/results/jacoco-cypress.exec && mv target/site/jacoco target/site/jacoco-cypress  )

# TODO
ls -al -R
