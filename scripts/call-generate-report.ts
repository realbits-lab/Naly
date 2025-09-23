import { db } from '../src/lib/db';
import { users } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function callGenerateReport() {
  console.log('🚀 Calling generate-report API...');

  try {
    // Find a manager user to use for authentication
    const [managerUser] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'manager'))
      .limit(1);

    if (!managerUser) {
      console.error('❌ No manager user found. Need a manager user to call the API.');
      return;
    }

    console.log(`👤 Using manager user: ${managerUser.email}`);

    // Make the API call
    const response = await fetch('http://localhost:4000/api/monitor/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`📡 Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.error('❌ Error response:', error);
    }

  } catch (error) {
    console.error('❌ Error calling generate-report API:', error);
  }
}

callGenerateReport().catch(console.error);