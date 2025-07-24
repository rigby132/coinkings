import csv

types = set()
coins = []
findspots = set()
found_in = []
classified_as = []

with open('../source/numisdata.csv', newline='\n') as file:
    reader = csv.reader(file, delimiter=';', quotechar='"')
    next(reader)
    for row in reader:
        if row[0] == '':
            continue

        # extract coin
        coins.append((row[0], row[10], row[11], row[12], row[15], row[16]))

        # extract types
        obv_type_descriptions = row[8].split('|')
        rev_type_descriptions = row[9].split('|')
        for i in range(1,7):
            if row[i] == '':
                break
            class_string = row[i].split('|')[0].split(',')[0].strip()
            type_string = row[i].split('|')[1].strip()
            desc_obv = obv_type_descriptions[i-1].strip()
            desc_rev = rev_type_descriptions[i-1].strip()
            types.add((class_string, type_string, desc_obv, desc_rev))
            classified_as.append((row[0], class_string, type_string))

        # extract finspot
        if row[13] != '':
            found_in.append((row[0], row[13]))
            findspots.add((row[13], row[14]))

with open('types.csv', 'w', newline='\n') as file:
    writer = csv.writer(file, delimiter=';', quotechar='"')
    writer.writerow(['class', 'type', 'desc_obv', 'desc_rev'])

    types_list = list(types)
    types_list = sorted(types_list)

    for row in types_list:
        writer.writerow(row)

with open('coins.csv', 'w', newline='\n') as file:
    writer = csv.writer(file, delimiter=';', quotechar='"')
    writer.writerow(['coin_id', 'collection', 'inventory_id', 'hoard', 'weight', 'diameter'])

    for coin in coins:
        writer.writerow(coin)

with open('findspots.csv', 'w', newline='\n') as file:
    writer = csv.writer(file, delimiter=';', quotechar='"')
    writer.writerow(['placename', 'remark'])

    for findspot in findspots:
        writer.writerow(findspot)

with open('found_in.csv', 'w', newline='\n') as file:
    writer = csv.writer(file, delimiter=';', quotechar='"')
    writer.writerow(['coin_id', 'placename'])

    for rel in found_in:
        writer.writerow(rel)

with open('classified_as.csv', 'w', newline='\n') as file:
    writer = csv.writer(file, delimiter=';', quotechar='"')
    writer.writerow(['coin_id', 'class', 'type'])

    for rel in classified_as:
        writer.writerow(rel)

similarity_obv = {}
with open('../source/similarity_obv.csv', newline='\n') as file:
    reader = csv.reader(file, delimiter=',', quotechar='"')
    row0 = next(reader)
    ids = list(map(lambda s: s.split('_')[0], row0[1:-1]))

    for i, row in enumerate(reader):
        id = row[0].split('_')[0]
        if id != ids[i]:
            print('mismatch:', id, ids[i], i)
            exit()

        for j, value in enumerate(row[1:-1]):
            if float(value) != 0:
                similarity_obv[frozenset([id, ids[j]])] = float(value)

similarity_rev = {}
with open('../source/similarity_rev.csv', newline='\n') as file:
    reader = csv.reader(file, delimiter=',', quotechar='"')
    row0 = next(reader)
    ids = list(map(lambda s: s.split('_')[0], row0[1:-1]))

    for i, row in enumerate(reader):
        id = row[0].split('_')[0]
        if id != ids[i]:
            print('mismatch:', id, ids[i], i)
            exit()

        for j, value in enumerate(row[1:-1]):
            if float(value) != 0:
                similarity_rev[frozenset([id, ids[j]])] = float(value)

with open('similarity.csv', 'w', newline='\n') as file:
    writer = csv.writer(file, delimiter=';', quotechar='"')
    writer.writerow(['coin_id0', 'coin_id1', 'score_obv', 'score_rev'])

    keys = set(list(similarity_obv.keys()) + list(similarity_rev.keys()))

    for key in keys:
        ids = list(key)
        writer.writerow([ids[0], ids[1], similarity_obv.get(key, 0.0), similarity_rev.get(key, 0.0)])


# dies.csv is directly converted from it's .xlsx file
# coordinates.csv was manually created
# some manual clean up must also be done before importing into neo4j (eg. coin 3414 has 2 findspots)
