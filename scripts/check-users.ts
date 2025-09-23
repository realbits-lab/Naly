import { db } from '../src/lib/db';
import { users } from '../src/lib/schema/users';

async function checkUsers() {
  console.log('👥 Checking users in database...');

  try {
    const userList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role
    }).from(users);

    console.log(`📊 Total users in database: ${userList.length}`);

    if (userList.length > 0) {
      console.log('\n👤 Users found:');
      userList.forEach((user, index) => {
        console.log(`[${index + 1}] ${user.email} (${user.name}) - ${user.role} - ID: ${user.id}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkUsers();