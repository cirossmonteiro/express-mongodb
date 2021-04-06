#!/bin/bash

declare -a countries=(
    "english=Brazil&portuguese=Brasil"
    "english=USA&portuguese=EUA"
    "english=UK&portuguese=Reino Unido"
)

declare -a snakes=(
    "binomial=Boa constrictor&popular=jiboia-constritora&venomous=false&region=Brazil"
    "binomial=Bothrops jararaca&popular=jararaca-da-mata&venomous=true&region=USA"
    "binomial=Crotalus durissus&popular=cascavel&venomous=true&region=UK"
    "binomial=Eunectes murinus&popular=sucuri-verde&venomous=false&region=Brazil"
)

echo "Doing some posts..."

for params in "${countries[@]}"; do
    curl -X POST --data "${params}" http://localhost:3000/countries && echo
    # echo ${params}
done

for params in "${snakes[@]}"; do
    curl -X POST --data "${params}" http://localhost:3000/snakes && echo
    # echo ${params}
done

# curl -X DELETE http://localhost:3000