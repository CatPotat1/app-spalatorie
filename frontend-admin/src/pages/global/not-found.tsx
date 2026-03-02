import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    const navigate = useNavigate();

    const onClick = () => {
        navigate("/");
    }

    return (
        <div className="w-full h-full flex flex-col justify-center items-center gap-y-5 pb-20">
            <img
                src={"/Logo.jpg"}
                alt="Logo"
                className="w-40 pointer-events-none"
            />
            
            <h1>404 Page Not Found</h1>
            <Button onClick={onClick}>Back to main page</Button>
        </div>
    );
};
