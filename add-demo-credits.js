/**
 * Add Credits to Demo Account
 * Adds 50 credits to demo@swiftnotes.app account
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addCreditsToDemo() {
  console.log('💳 Adding 50 Credits to Demo Account...');
  console.log('=====================================');
  
  const demoEmail = 'demo@swiftnotes.app';
  const creditsToAdd = 50;
  
  try {
    // Step 1: Find the demo user
    console.log('🔍 Finding demo user...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    const demoUser = users.users.find(user => user.email === demoEmail);
    
    if (!demoUser) {
      console.error('❌ Demo user not found with email:', demoEmail);
      return;
    }
    
    console.log('✅ Demo user found:', demoUser.id);
    
    // Step 2: Get current credits
    console.log('📊 Getting current credits...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits, tier')
      .eq('user_id', demoUser.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    const currentCredits = profile.credits || 0;
    const newCredits = currentCredits + creditsToAdd;
    
    console.log(`📈 Current credits: ${currentCredits}`);
    console.log(`➕ Adding: ${creditsToAdd} credits`);
    console.log(`🎯 New total: ${newCredits} credits`);
    
    // Step 3: Update credits directly
    console.log('💰 Adding credits...');

    // Update user profile credits
    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', demoUser.id);

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      return;
    }

    // Log the transaction
    const { data: logResult, error: logError } = await supabase
      .from('user_credits')
      .insert({
        user_id: demoUser.id,
        transaction_type: 'purchase',
        amount: creditsToAdd,
        description: 'Admin credit bonus - Demo account top-up',
        reference_id: `admin-bonus-${Date.now()}`
      });

    if (logError) {
      console.error('⚠️ Warning: Could not log transaction:', logError);
      // Don't return here, credits were still added
    }
    
    // Step 4: Verify the update
    console.log('✅ Credits added successfully!');
    console.log('🔍 Verifying update...');
    
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('credits, tier, updated_at')
      .eq('user_id', demoUser.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('✅ Verification successful!');
    console.log(`📊 Final credits: ${updatedProfile.credits}`);
    console.log(`🏷️ Tier: ${updatedProfile.tier}`);
    console.log(`🕒 Updated at: ${updatedProfile.updated_at}`);
    
    // Step 5: Check credit transaction log
    console.log('📋 Checking transaction log...');
    const { data: transactions, error: transError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', demoUser.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (transError) {
      console.error('❌ Error fetching transactions:', transError);
    } else {
      console.log('📝 Recent transactions:');
      transactions.forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.transaction_type}: ${trans.amount > 0 ? '+' : ''}${trans.amount} - ${trans.description}`);
      });
    }
    
    console.log('\n🎉 Demo Account Credit Update Complete!');
    console.log('=====================================');
    console.log(`✅ Successfully added ${creditsToAdd} credits to ${demoEmail}`);
    console.log(`💰 New balance: ${updatedProfile.credits} credits`);
    console.log('\n🌐 The demo user can now use these credits for AI generation!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
if (require.main === module) {
  addCreditsToDemo().catch(console.error);
}

module.exports = { addCreditsToDemo };
