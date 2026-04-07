import json, random

users=[]
restaurants=[]
menus=[]
agents=[]
orders=[]
carts=[]
first_names=['Aayush','Rahul','Priya','Neha','Anjali','Karan','Sanya','Rohit','Meera','Divya','Vikram','Riya','Sameer','Pooja','Amit','Nisha','Vishal','Tanya','Sahil','Ishita','Manish','Sara','Arjun','Kavya','Nikhil','Aarav','Sneha','Rohan','Karan','Simran']
last_names=['Sharma','Patel','Kumar','Reddy','Joshi','Mehta','Gupta','Singh','Agarwal','Khan','Chopra','Desai','Naik','Nambiar','Bose','Rao']
cities=['Mumbai','Pune','Bangalore','Chennai','Hyderabad','Delhi','Kolkata']
streets=['MG Road','Brigade Road','Colaba Causeway','Bandra West','Juhu Beach Road','Church Street','Koramangala','Indiranagar','Banjara Hills','Salt Lake']
food_items=[
    ('Hyderabadi Biryani','Indian','https://source.unsplash.com/featured/?biryani'),
    ('Paneer Tikka','Indian','https://source.unsplash.com/featured/?paneertikka'),
    ('Masala Dosa','Indian','https://source.unsplash.com/featured/?dosa'),
    ('Tandoori Chicken','Indian','https://source.unsplash.com/featured/?tandoori'),
    ('Momos','Chinese','https://source.unsplash.com/featured/?momos'),
    ('Chicken Shawarma','FastFood','https://source.unsplash.com/featured/?shawarma'),
    ('Cheese Pizza','FastFood','https://source.unsplash.com/featured/?pizza'),
    ('Veg Burger','FastFood','https://source.unsplash.com/featured/?burger'),
    ('Sushi Roll','Continental','https://source.unsplash.com/featured/?sushi'),
    ('Pasta Alfredo','Continental','https://source.unsplash.com/featured/?pasta'),
    ('Chicken Biryani','Indian','https://source.unsplash.com/featured/?chickenbiryani'),
    ('Naan Basket','Indian','https://source.unsplash.com/featured/?naan'),
    ('Chole Bhature','Indian','https://source.unsplash.com/featured/?cholebhature'),
    ('Veg Thali','Indian','https://source.unsplash.com/featured/?thali'),
    ('American Sandwich','FastFood','https://source.unsplash.com/featured/?sandwich'),
    ('Schezwan Noodles','Chinese','https://source.unsplash.com/featured/?noodles'),
    ('Gulab Jamun','Indian','https://source.unsplash.com/featured/?gulabjamun'),
    ('Falafel Wrap','Continental','https://source.unsplash.com/featured/?falafel'),
    ('Grilled Chicken','Continental','https://source.unsplash.com/featured/?grilledchicken'),
    ('Pav Bhaji','Indian','https://source.unsplash.com/featured/?pavbhaji'),
    ('Veg Spring Roll','Chinese','https://source.unsplash.com/featured/?springroll'),
    ('Chocolate Brownie','Continental','https://source.unsplash.com/featured/?brownie'),
    ('Fish Curry','Indian','https://source.unsplash.com/featured/?fishcurry'),
]

for i in range(1,51):
    first=random.choice(first_names)
    last=random.choice(last_names)
    username=f"{first.lower()}_{last.lower()}"
    users.append({
        'id': f'usr_{i:03d}',
        'username': username,
        'email': f'{first.lower()}.{last.lower()}{i}@example.com',
        'phoneNo': f'+91{random.randint(9000000000,9999999999)}',
        'password': 'password123',
        'address':[{'street': f'{random.randint(12,999)} {random.choice(streets)}', 'city': random.choice(cities)}],
        'role':'Customer',
        'createdAt':'2025-12-01T08:00:00.000Z'
    })
for idx in range(10):
    users[idx]['role']='Owner'

restaurant_names=['Spice Village','Ocean Grill','Urban Dine','Royal Rasoi','Curry House','Saffron Lounge','Bombay Bites','Mango Tree','Silk Route','Pune Spice','King Kebab','Garden Cafe','Taste of India','Golden Plate','The Dosa Corner','Route 66','Dragon Wok','Pizza Junction','The Grill Studio','Skyline Eatery']
for i,name in enumerate(restaurant_names, start=1):
    owner_id = users[(i-1)%10]['id']
    city=random.choice(cities)
    restaurants.append({
        'restaurantId': f'rest_{i:03d}',
        'restaurantName': name,
        'ownerId': owner_id,
        'contactNo': f'+91{random.randint(9000000000,9999999999)}',
        'address': f'{random.randint(10,999)} {random.choice(streets)}, {city}',
        'email': f'{name.lower().replace(" ","")}@foodhub.com',
        'cuisine': [random.choice(['Indian','FastFood','Chinese','Continental']) for _ in range(2)],
        'isVeg': random.choice([True, False]),
        'rating': round(random.uniform(3.8,4.9),1),
        'gstinNo': f'27ABCDE{random.randint(1000,9999)}Z5F1',
        'imageUrl': f'https://source.unsplash.com/featured/?restaurant,{name.split()[0].lower()}'
    })

for i in range(1,201):
    item,category,image = random.choice(food_items)
    rest = random.choice(restaurants)
    menus.append({
        'menuId': f'menu_{i:03d}',
        'restaurantId': rest['restaurantId'],
        'itemName': item,
        'price': round(random.uniform(120,760),2),
        'category': category,
        'rating': round(random.uniform(3.5,4.9),1),
        'isAvailable': random.choice([True, True, True, False]),
        'description': f'{item} served hot with authentic spices and sauces.',
        'isVeg': all(x not in item.lower() for x in ['chicken','fish','tandoori','shawarma']),
        'imageUrl': image
    })

for i in range(1,51):
    agents.append({
        'id': f'agent_{i:03d}',
        'agentName': f"{random.choice(first_names)} {random.choice(last_names)}",
        'contactNo': f'+91{random.randint(9000000000,9999999999)}',
        'isAvailable': random.choice([True, True, False]),
        'vehicleNo': f'MH{random.randint(12,99)}{random.choice("ABCD")}{random.randint(1000,9999)}'
    })

cust_ids=[u['id'] for u in users if u['role']=='Customer']
for i in range(1,51):
    user_id=random.choice(cust_ids)
    rest = random.choice(restaurants)
    selected=[m for m in menus if m['restaurantId']==rest['restaurantId']]
    chosen=random.sample(selected, min(4,len(selected)))
    total=0
    cart_items=[]
    for item in chosen:
        qty=random.randint(1,3)
        total += item['price']*qty
        cart_items.append({'itemId': item['menuId'], 'quantity': qty, 'price': item['price']})
    carts.append({
        'id': f'cart_{i:03d}',
        'userId': user_id,
        'restaurantId': rest['restaurantId'],
        'items': cart_items,
        'totalAmount': round(total,2)
    })

for i in range(1,101):
    user_id=random.choice(cust_ids)
    rest=random.choice(restaurants)
    selected=[m for m in menus if m['restaurantId']==rest['restaurantId']]
    chosen=random.sample(selected, min(5,len(selected)))
    total=0
    order_items=[]
    for item in chosen:
        qty=random.randint(1,3)
        total += item['price']*qty
        order_items.append({'itemId': item['menuId'], 'quantity': qty, 'price': item['price']})
    agent = random.choice(agents)
    status=random.choice(['Pending','Preparing','Out for Delivery','Delivered'])
    orders.append({
        'orderId': f'order_{i:03d}',
        'userId': user_id,
        'restaurantId': rest['restaurantId'],
        'items': order_items,
        'totalAmount': round(total,2),
        'status': status,
        'date': f'2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}T12:00:00.000Z',
        'deliveryAgentId': agent['id']
    })

payload={'users':users,'restaurants':restaurants,'menus':menus,'deliveryAgents':agents,'orders':orders,'carts':carts}
with open('config/db.json','w',encoding='utf8') as f:
    json.dump(payload,f,indent=2)
print('Generated config/db.json with counts:', {k: len(v) for k, v in payload.items()})
