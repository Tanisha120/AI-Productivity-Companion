import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      await connectDB();
      try {
        await User.findOneAndUpdate(
          { googleId: account?.providerAccountId },
          {
            $set: {
              googleId: account?.providerAccountId,
              email: user.email,
              name: user.name ?? "User",
              avatar: user.image ?? undefined,
              googleAccessToken: account?.access_token,
              googleRefreshToken: account?.refresh_token,
              googleTokenExpiry: account?.expires_at
                ? new Date(account.expires_at * 1000)
                : undefined,
              calendarConnected: !!account?.access_token,
            },
          },
          { upsert: true, new: true }
        );
        return true;
      }  catch (error) {
          console.error("SignIn Error:", error);
          throw error;
        }
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.googleId = account.providerAccountId;
        token.accessToken = account.access_token;
      }
      if (token.googleId && !token.dbUserId) {
        await connectDB();
        const dbUser = await User.findOne({ googleId: token.googleId }).select(
          "_id"
        );
        if (dbUser) token.dbUserId = dbUser._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dbUserId) {
        session.user.id = token.dbUserId as string;
      }
      session.user.googleId = token.googleId as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
