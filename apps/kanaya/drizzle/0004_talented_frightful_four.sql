ALTER TABLE "digital_cards" DROP CONSTRAINT "digital_cards_linked_id_card_id_idcards_id_fk";
--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "tags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "digital_cards" ADD CONSTRAINT "digital_cards_linked_id_card_id_idcards_id_fk" FOREIGN KEY ("linked_id_card_id") REFERENCES "public"."idcards"("id") ON DELETE cascade ON UPDATE no action;