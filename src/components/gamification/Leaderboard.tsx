import { createClient } from "@/lib/supabase/server";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";

export async function Leaderboard() {
    const supabase = createClient();
    const { data: leaders } = await supabase
        .from("profiles")
        .select("email, xp, rank, departments(name)")
        .order("xp", { ascending: false })
        .limit(10);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    リーダーボード
                </CardTitle>
                <CardDescription>今月のAI学習ランキング</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {leaders?.map((user, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="flex h-8 w-8 items-center justify-center font-bold text-muted-foreground">
                                {index === 0 ? <Medal className="h-6 w-6 text-yellow-500" /> :
                                    index === 1 ? <Medal className="h-6 w-6 text-gray-400" /> :
                                        index === 2 ? <Medal className="h-6 w-6 text-amber-600" /> :
                                            index + 1}
                            </div>
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{user.email}</p>
                                <p className="text-xs text-muted-foreground">{(user.departments as any)?.name || "部署なし"}</p>
                            </div>
                            <div className="font-bold">{user.xp} XP</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
