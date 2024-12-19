import { MongoClient, ObjectId } from "mongodb";

async function seed() {
  const client = new MongoClient(
    "mongodb://root:example@localhost:27017/admin"
  );

  try {
    await client.connect();
    const db = client.db("test");

    await db
      .collection("users")
      .drop()
      .catch(() => {});
    await db
      .collection("products")
      .drop()
      .catch(() => {});
    await db
      .collection("orders")
      .drop()
      .catch(() => {});

    await db.createCollection("users");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ "address.city": 1 });

    await db.createCollection("products");
    await db.collection("products").createIndex({ sku: 1 }, { unique: true });
    await db.collection("products").createIndex({ category: 1 });

    await db.createCollection("orders");
    await db.collection("orders").createIndex({ userId: 1 });
    await db.collection("orders").createIndex({ orderDate: 1 });

    const userIds = {
      john: new ObjectId(),
      jane: new ObjectId(),
    };

    const users = [
      {
        _id: userIds.john,
        email: "john@example.com",
        name: "John Doe",
        age: 30,
        address: {
          street: "123 Main St",
          city: "New York",
          country: "USA",
          coordinates: {
            lat: 40.7128,
            lng: -74.006,
          },
        },
        interests: ["sports", "technology"],
        memberSince: new Date("2023-01-01"),
        isActive: true,
      },
      {
        _id: userIds.jane,
        email: "jane@example.com",
        name: "Jane Smith",
        age: 25,
        address: {
          street: "456 Market St",
          city: "San Francisco",
          country: "USA",
          coordinates: {
            lat: 37.7749,
            lng: -122.4194,
          },
        },
        interests: ["art", "music", "travel"],
        memberSince: new Date("2023-02-15"),
        isActive: true,
      },
    ];

    await db.collection("users").insertMany(users);

    const products = [
      {
        _id: new ObjectId(),
        sku: "LAPTOP001",
        name: "Pro Laptop",
        category: "Electronics",
        price: 1299.99,
        specs: {
          cpu: "Intel i7",
          ram: "16GB",
          storage: "512GB SSD",
        },
        inStock: true,
        tags: ["laptop", "computer", "work"],
        ratings: [4.5, 4.8, 4.2],
        lastUpdated: new Date(),
      },
      {
        _id: new ObjectId(),
        sku: "PHONE001",
        name: "SmartPhone X",
        category: "Electronics",
        price: 699.99,
        specs: {
          screen: "6.1 inch",
          camera: "12MP",
          storage: "256GB",
        },
        inStock: true,
        tags: ["phone", "mobile", "smart device"],
        ratings: [4.7, 4.6],
        lastUpdated: new Date(),
      },
      {
        _id: new ObjectId(),
        sku: "BOOK001",
        name: "Database Design",
        category: "Books",
        price: 49.99,
        specs: {
          format: "Hardcover",
          pages: 500,
          language: "English",
        },
        inStock: false,
        tags: ["education", "technology", "programming"],
        ratings: [4.9],
        lastUpdated: new Date(),
      },
    ];

    await db.collection("products").insertMany(products);

    const orders = [
      {
        _id: new ObjectId(),
        userId: userIds.john,
        orderDate: new Date("2024-01-15"),
        status: "completed",
        items: [
          {
            productSku: "LAPTOP001",
            quantity: 1,
            priceAtTime: 1299.99,
          },
          {
            productSku: "BOOK001",
            quantity: 2,
            priceAtTime: 49.99,
          },
        ],
        totalAmount: 1399.97,
        shippingAddress: {
          street: "123 Main St",
          city: "New York",
          country: "USA",
        },
        paymentMethod: {
          type: "credit_card",
          last4: "4242",
        },
      },
      {
        _id: new ObjectId(),
        userId: userIds.jane,
        orderDate: new Date("2024-02-01"),
        status: "processing",
        items: [
          {
            productSku: "PHONE001",
            quantity: 1,
            priceAtTime: 699.99,
          },
        ],
        totalAmount: 699.99,
        shippingAddress: {
          street: "456 Market St",
          city: "San Francisco",
          country: "USA",
        },
        paymentMethod: {
          type: "paypal",
          email: "jane@example.com",
        },
      },
    ];

    await db.collection("orders").insertMany(orders);

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.close();
  }
}

seed();
