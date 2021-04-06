#!/bin/bash

declare -a snakes=(
    "binomial=Boa constrictor&popular=jiboia-constritora&venomous=false"
    "binomial=Bothrops jararaca&popular=jararaca-da-mata&venomous=true"
    "binomial=Crotalus durissus&popular=cascavel&venomous=true"
    "binomial=Eunectes murinus&popular=sucuri-verde&venomous=false"
)

echo "Doing some posts..."

for params in "${snakes[@]}"; do
    curl -X POST --data "${params}" http://localhost:3000 && echo
    # echo ${params}
done

# curl -X POST --data "binomial=Boa constrictor&popular=jiboia-constritora&venomous=false" http://localhost:3000
# curl -X POST --data "binomial=Bothrops jararaca&popular=jararaca-da-mata&venomous=true" http://localhost:3000
# curl -X POST --data "binomial=Crotalus durissus&popular=cascavel&venomous=true" http://localhost:3000
# curl -X POST --data "binomial=Eunectes murinus&popular=sucuri-verde&venomous=false" http://localhost:3000

# curl -X DELETE http://localhost:3000