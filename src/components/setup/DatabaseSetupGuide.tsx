import React, { useState } from 'react';
import { Database, ExternalLink, Copy, CheckCircle } from 'lucide-react';

interface DatabaseSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const DatabaseSetupGuide: React.FC<DatabaseSetupGuideProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- SaaS Features Database Schema for Flowniq.ai
-- Execute this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tokens INTEGER DEFAULT 100, -- New users get 100 free tokens
    total_tokens_used INTEGER DEFAULT 0,
    subscription_status TEXT DEFAULT 'free', -- free, premium, enterprise
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token transaction history
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
    tokens_amount INTEGER NOT NULL, -- positive for addition, negative for deduction
    description TEXT NOT NULL,
    roadmap_id UUID, -- reference to roadmap if token was used for generation
    payment_id TEXT, -- Razorpay payment ID if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tokens_included INTEGER NOT NULL,
    price_inr DECIMAL(10,2) NOT NULL, -- Price in Indian Rupees
    price_usd DECIMAL(10,2) NOT NULL, -- Price in USD
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment records
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    razorpay_payment_id TEXT UNIQUE NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    amount_inr DECIMAL(10,2) NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    tokens_purchased INTEGER NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Update existing roadmaps table to track token usage
ALTER TABLE roadmaps 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, tokens_included, price_inr, price_usd, sort_order) VALUES
('Starter Pack', '100 tokens for beginners', 100, 199.00, 2.99, 1),
('Professional Pack', '500 tokens for professionals', 500, 899.00, 11.99, 2),
('Business Pack', '1000 tokens for teams', 1000, 1599.00, 19.99, 3),
('Enterprise Pack', '5000 tokens for enterprises', 5000, 6999.00, 89.99, 4)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tokens ON user_profiles(tokens);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Token transactions policies
CREATE POLICY "Users can view own token transactions" ON token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own token transactions" ON token_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscription plans are readable by all authenticated users
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (auth.role() = 'authenticated');

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user profile updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to deduct tokens and create transaction record
CREATE OR REPLACE FUNCTION public.deduct_user_tokens(
    p_user_id UUID,
    p_tokens INTEGER,
    p_description TEXT,
    p_roadmap_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_tokens INTEGER;
BEGIN
    -- Get current token balance
    SELECT tokens INTO current_tokens 
    FROM user_profiles 
    WHERE id = p_user_id;
    
    -- Check if user has enough tokens
    IF current_tokens < p_tokens THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct tokens from user profile
    UPDATE user_profiles 
    SET tokens = tokens - p_tokens,
        total_tokens_used = total_tokens_used + p_tokens,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create transaction record
    INSERT INTO token_transactions (user_id, transaction_type, tokens_amount, description, roadmap_id)
    VALUES (p_user_id, 'usage', -p_tokens, p_description, p_roadmap_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add tokens and create transaction record
CREATE OR REPLACE FUNCTION public.add_user_tokens(
    p_user_id UUID,
    p_tokens INTEGER,
    p_description TEXT,
    p_payment_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Add tokens to user profile
    UPDATE user_profiles 
    SET tokens = tokens + p_tokens,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Create transaction record
    INSERT INTO token_transactions (user_id, transaction_type, tokens_amount, description, payment_id)
    VALUES (p_user_id, 'purchase', p_tokens, p_description, p_payment_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlSchema);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Database Setup Required</h2>
              <p className="text-sm text-gray-500">Execute this SQL schema in your Supabase dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Steps:</h3>
              <ol className="text-blue-800 text-sm space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                  <span>Copy the SQL schema below</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  <span>Open your Supabase dashboard → SQL Editor</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                  <span>Paste and execute the SQL schema</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                  <span>Refresh this page to load the token system</span>
                </li>
              </ol>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleCopySQL}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${copied 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy SQL Schema'}</span>
              </button>

              <a
                href="https://supabase.com/dashboard/project"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Supabase Dashboard</span>
              </a>
            </div>
          </div>

          {/* SQL Schema */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Database Schema SQL</h4>
              <span className="text-gray-400 text-xs">database/schema.sql</span>
            </div>
            <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              {sqlSchema}
            </pre>
          </div>

          {/* Footer */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 font-bold">⚠️</span>
              <div className="text-yellow-800 text-sm">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• This creates the SaaS database structure for token management</li>
                  <li>• New users will automatically get 100 free tokens</li>
                  <li>• Subscription plans and payment tables will be created</li>
                  <li>• Row Level Security (RLS) policies ensure data privacy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetupGuide;