// filepath: /C:/Users/phyoz/OneDrive/Desktop/Code2Career ERP/MyanTech-ERP-Solution/api/src/db/seed.js
const connection = require('./connection');

async function main() {
    const users = [
        {
            email: 'alice@example.com',
            name: 'Alice',
            posts: [
                {
                    title: 'Setting up express',
                    content: 'We are going to use TypeScript',
                    published: true,
                },
            ],
        },
        {
            email: 'bob@example.com',
            name: 'Bob',
            posts: [
                {
                    title: 'Prisma ORM',
                    content: 'With SQLite, win!',
                    published: true,
                },
                {
                    title: 'Migration and Seeding',
                    content: "Let's get started",
                    published: true,
                },
            ],
        },
    ];

    for (const user of users) {
        const [result] = await connection.promise().query(
            'INSERT INTO User (email, name) VALUES (?, ?)',
            [user.email, user.name]
        );

        for (const post of user.posts) {
            await connection.promise().query(
                'INSERT INTO Post (title, content, published, authorId) VALUES (?, ?, ?, ?)',
                [post.title, post.content, post.published, result.insertId]
            );
        }
    }

    console.log('Seed data inserted');
}

main()
    .then(() => {
        connection.end();
    })
    .catch((e) => {
        console.error(e);
        connection.end();
        process.exit(1);
    });