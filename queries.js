// Mongodb operrations  for plp_bookstore

const { MongoClient } = require('mongodb');
const { title } = require('process');

const url = 'mongodb://localhost:27017/';
const dbName = 'plp_bookstore';
const collectionName = 'books';

async function run() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('connected to Mongodb server');

        const db = client.db(dbName);
        const books = db.collection(collectionName)

        // 1. CRUD Operations
        // ----------------------
        // CREATE - insert one book
        await books.insertOne({
            title: "New Book",
            author: "Test Author",
            genre: "Fiction",
            published_year: 2022,
            price: 15.99,
            in_stock: true,
            pages: 250,
            publisher: "Test Publisher"
        });

        // READ - find all books in aspecific genre
        console.log('\n Fiction Books:');
        console.log(await books.find({ genre: 'Fiction' }).toArray());

        // READ - Find books published after a certain year
        console.log('\n📚 Books published after 2000:');
        console.log(await books.find({ published_year: { $gt: 2000 } }).toArray())

        // READ - Find books by a specific author
        console.log('\n📚 Books by George Orwell:');
        console.log(await books.find({ author: 'George Orwell' }).toArray());

        // UPDATE - Update the price of a specific book
        await books.updateOne(
            { title: "To Kill a Mockingbird" },
            { $set: { price: 15.99 } }
        );
        console.log('\n Updated To Kill a Mockingbird book price:');

        // DELETE - Delete a book by title
        await books.deleteOne({ title: 'New Book' });
        console.log("\n Deleted 'New Book'");



        // 2. Advanced queries

        // Find books in stock and published after 1960
        console.log('\n📚 In stock & published after 1960:');
        console.log(
            await books.find({ in_stock: true, published_year: { $gt: 1960 } }).toArray()
        );

        // projection - only return title, author and price
        console.log('\n🎯 Projection (title, author, price):');
        console.log(
            await books.find({}, { projection: { title: 1, author: 1, price: 1, _id: 0} }).toArray()
        );

        // sorting by price ascending
        console.log("\n⬆️ Books sorted by price (ascending):");
        console.log(
            await books.find().sort({ price: 1 }).toArray()
        );

        // sorting price by descending
        console.log("\n\n⬇️ Books sorted by price (descending):")
        console.log(
            await books.find().sort({ price: -1 }).toArray()
        );

        // pagination ( using limit and skip methods ) - 5 books per pages
        console.log("\n📄 Page 1 (first 5 books):");
        console.log(await books.find().limit(5).toArray());

        console.log("\n📄 Page 2 (first 5 books):");
        console.log(await books.find().skip(5).limit(5).toArray());



        // 3. Aggregation pipelines

        // Average price of books by genre
        console.log("\n📊 Average price by genre:");
        console.log(
            await books.aggregate([
                { $group: { _id: "$genre", avgPrice: { $avg: "$price" } } }
            ]).toArray()
        );

        // Author with the most books
        console.log("\n👑 Author with most books:")
        console.log(
            await books.aggregate([
                { $group: { _id: "$author", bookCount: { $sum: 1 } } },
                { $sort: { bookCount: -1 } },
                { $limit: 1 }
            ]).toArray()
        );

        // Group books by publication decade
        console.log("\n📅 Books grouped by decade:")
        console.log(
            await books.aggregate([
                { $project: { decade: { $subtract: [ { $divide: ["$published_year", 10] }, { $mod: [{ $divide: ["$published_year", 10] }, 1] } ] } } },
                { $group: { _id: "$decade", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray()
        );


        // 4. INDEXING 


        // create index on title
        await books.createIndex({ title: 1 });
        console.log("\n⚡ Index created on 'title'");
        
        // compund index on auther and published_year
        await books.createIndex({ author: 1, published_year: -1 });
        console.log("\n⚡ Compound index created on 'author + published_year'");

        // performance improvement
        console.log("\n🔍 Explain query with index:")
        console.log(await books.find({ title: "1984" }).explain("executionStats"));



    } catch (err) {
        console.error('Error occured:', err);
    } finally {
        await client.close();
        console.log('\nConnection closed');
    }
}

run();
