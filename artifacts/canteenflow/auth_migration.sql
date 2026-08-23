-- ==========================================
-- AUTHENTICATION & REGISTRATION MIGRATION
-- ==========================================

-- 1. ADD NEW COLUMNS TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hostel_type TEXT;

-- 2. CREATE AUTH TRIGGER (Inserts profile when user registers via Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, department, hostel_type, role, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Student'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'hostel', 'boys'),
    'student',
    'pending'
  );
  
  -- Create Notification for Admin
  INSERT INTO public.notifications (
    recipient_role,
    title,
    message,
    notification_type
  ) VALUES (
    'admin',
    'New Registration Request',
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Student') || ' has requested access to CanteenFlow.',
    'NEW_REGISTRATION'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. APPROVAL RPC
CREATE OR REPLACE FUNCTION public.approve_student(
  p_student_id UUID,
  p_status TEXT, -- 'approved' or 'rejected'
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve students.';
  END IF;

  -- Update student
  UPDATE public.profiles
  SET 
    approval_status = p_status,
    approved_at = NOW(),
    approved_by = auth.uid()
  WHERE id = p_student_id;

  -- Create Notification for Student
  IF p_status = 'approved' THEN
    INSERT INTO public.notifications (
      recipient_id,
      recipient_role,
      title,
      message,
      notification_type
    ) VALUES (
      p_student_id,
      'student',
      'Account Approved',
      'Your CanteenFlow account has been approved. You can now access the application.',
      'ACCOUNT_APPROVED'
    );
  END IF;
END;
$$;

-- 4. SECURITY TRIGGER (Prevent students from escalating privileges)
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- If role or approval status changed, verify caller is admin
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: You cannot change your own role or approval status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_security ON public.profiles;
CREATE TRIGGER enforce_profile_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.check_profile_update();

-- 5. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own non-sensitive profile data" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow all authenticated users to view profiles (prevents infinite recursion)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin Setup Helper (Run this manually after registering your admin account)
-- UPDATE public.profiles SET role = 'admin', approval_status = 'approved' WHERE email = 'your.email@example.com';
