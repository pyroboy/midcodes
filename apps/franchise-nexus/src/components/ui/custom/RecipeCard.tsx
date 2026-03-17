
import { ChefHat, Clock, DollarSign, Eye } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string;
  prepTime: number;
  cost: number;
  imageUrl: string;
  tags: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: (recipe: Recipe) => void;
  className?: string;
}

const RecipeCard = ({ recipe, onClick, className }: RecipeCardProps) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md", 
        onClick && "cursor-pointer transform hover:-translate-y-1",
        className
      )}
      onClick={() => onClick && onClick(recipe)}
    >
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="object-cover w-full h-full rounded-t-lg"
            loading="lazy"
          />
        </AspectRatio>
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <Badge variant="secondary" className="text-xs font-medium capitalize">
            {recipe.category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1 mb-1">{recipe.name}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {recipe.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock size={14} />
            <span>{recipe.prepTime} min</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign size={14} />
            <span>${recipe.cost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {recipe.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{recipe.tags.length - 2}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="secondary" className="ml-auto">
          <Eye size={14} className="mr-1" />
          View
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;
